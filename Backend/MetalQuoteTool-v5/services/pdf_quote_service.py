"""
pdf_quote_service.py — Phase 7A
=================================
Full PDF generation pipeline:

  Load data → Generate SVG → Render HTML → xhtml2pdf → Validate → Upload → Audit

Quality statuses: PASS | WARN | FAIL
FAIL PDFs are never stored.
All PDF versions are immutable — never overwritten.
"""
import io
import os
import math
import tempfile
import urllib.request
from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException
from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy.orm import Session, joinedload

from core.database import get_db
from models.quote import Quote, QuoteItem, QuoteStatusHistory, QuoteItemSvgCache
from models.rfq import RFQFile
from models.user import User
from models.setting import Setting
from data.constants import DENSITY, STANDARD_SHEETS, pick_sheet_for_part
from services.dxf_svg_service import (
    calculate_nesting_metrics,
    dxf_to_svg,
    generate_nesting_diagram_base64,
    render_part_preview_base64,
    svg_geometry_size,
)

# ─── Jinja2 environment ────────────────────────────────────────────────────────
_TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "..", "templates")

def _make_jinja_env() -> Environment:
    env = Environment(
        loader=FileSystemLoader(_TEMPLATE_DIR),
        autoescape=select_autoescape(["html"]),
    )

    def datefmt(value):
        if value is None:
            return "—"
        if isinstance(value, str):
            try:
                value = datetime.fromisoformat(value)
            except Exception:
                return value
        return value.strftime("%d %b %Y")

    env.filters["datefmt"] = datefmt
    return env

_JINJA_ENV = _make_jinja_env()

# ─── Default Terms & Conditions ───────────────────────────────────────────────
_DEFAULT_TERMS = """\
1. Prices are valid for the validity period stated on this quotation. Prices are subject to change after expiry.
2. Payment terms: 50% advance upon order confirmation; balance before dispatch.
3. Delivery: Ex-works. Transit insurance and freight are to the customer's account unless otherwise agreed.
4. Goods remain the property of the supplier until full payment is received.
5. Dimensions and material specifications are as per drawings / specifications provided by the customer.
6. Any deviation from the approved drawing will be subject to additional charges.
7. Taxes, duties, and levies applicable at the time of supply shall be borne by the buyer.
8. Disputes, if any, shall be subject to local jurisdiction only."""


# ═══════════════════════════════════════════════════════════════════════════════
#  Settings Helpers
# ═══════════════════════════════════════════════════════════════════════════════

def _get_all_settings(db: Session) -> dict:
    rows = db.query(Setting).all()
    result = {}
    for s in rows:
        # String settings use str_value; numeric use value
        if s.str_value is not None:
            result[s.key] = s.str_value
        elif s.value is not None:
            result[s.key] = s.value
    return result


def _load_company_info(settings: dict) -> dict:
    return {
        "name":      settings.get("company_name", ""),
        "address":   settings.get("company_address", ""),
        "phone":     settings.get("company_phone", ""),
        "email":     settings.get("company_email", ""),
        "website":   settings.get("company_website", ""),
        "gst":       settings.get("company_gst", ""),
        "logo_url":  settings.get("company_logo_url", ""),
    }


def _get_validity_days(settings: dict) -> int:
    try:
        return int(settings.get("quote_validity_days", 30))
    except Exception:
        return 30


def _get_terms(settings: dict) -> str:
    return settings.get("terms_and_conditions", _DEFAULT_TERMS)


# ═══════════════════════════════════════════════════════════════════════════════
#  SVG Cache
# ═══════════════════════════════════════════════════════════════════════════════

def _get_or_generate_svg(rfq_file: RFQFile, db: Session) -> Optional[str]:
    """
    Return cached SVG for this rfq_file, or generate and cache it.
    Returns None if the file is not a DXF or generation fails.
    """
    # Only DXF files produce real geometry SVGs
    ext = os.path.splitext(rfq_file.file_name)[1].lower()
    if ext != ".dxf":
        return None

    # Cache lookup
    cached = db.query(QuoteItemSvgCache).filter(
        QuoteItemSvgCache.rfq_file_id == rfq_file.id
    ).first()
    if cached:
        return cached.svg_content

    # Cache miss — fetch DXF from Supabase
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        return None

    tmp_path = None
    try:
        from supabase import create_client
        client = create_client(supabase_url, supabase_key)
        signed = client.storage.from_("rfq-files").create_signed_url(
            path=rfq_file.storage_path, expires_in=120
        )
        url = (
            signed.get("signedURL")
            or signed.get("signed_url")
            or (signed.get("data") or {}).get("signedUrl")
        )
        if not url:
            return None

        # Download to temp file
        import ssl
        fd, tmp_path = tempfile.mkstemp(suffix=".dxf")
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        with os.fdopen(fd, "wb") as f:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
                f.write(resp.read())

        # Generate SVG
        svg = dxf_to_svg(tmp_path, target_width=380)
        if not svg:
            return None

        # Cache it
        cache_entry = QuoteItemSvgCache(
            rfq_file_id=rfq_file.id,
            svg_content=svg,
        )
        db.add(cache_entry)
        db.commit()
        return svg

    except Exception:
        return None
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass


# ═══════════════════════════════════════════════════════════════════════════════
#  PDF Quality Validation
# ═══════════════════════════════════════════════════════════════════════════════

def validate_pdf_quality(pdf_bytes: bytes) -> tuple[str, list[str]]:
    """
    Inspect generated PDF bytes.
    Returns (status, warnings) where status ∈ {"PASS", "WARN", "FAIL"}.

    FAIL (not stored):
      - 0 pages
      - Page size deviates from A4 by > 15mm
      - Zero extractable text

    WARN (stored, flagged):
      - > 25 pages
      - < 100 characters of text

    PASS: clean.
    """
    warnings: list[str] = []
    status = "PASS"

    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(pdf_bytes))
        page_count = len(reader.pages)

        if page_count == 0:
            return "FAIL", ["PDF has 0 pages — generation failed"]

        # A4 in points: 595 × 842 (tolerance ±42pt ≈ 15mm)
        A4_W = 595.28
        A4_H = 841.89
        TOL  = 42.5

        page = reader.pages[0]
        try:
            mb = page.mediabox
            pw = float(mb.width)
            ph = float(mb.height)
            # accept both portrait and landscape A4
            portrait_ok  = (abs(pw - A4_W) < TOL and abs(ph - A4_H) < TOL)
            landscape_ok = (abs(pw - A4_H) < TOL and abs(ph - A4_W) < TOL)
            if not (portrait_ok or landscape_ok):
                return "FAIL", [
                    f"Page size {pw:.0f}×{ph:.0f}pt deviates from A4 ({A4_W:.0f}×{A4_H:.0f}pt) by more than 15mm"
                ]
        except Exception:
            warnings.append("Could not verify page dimensions")

        # Extract text
        total_text = ""
        for p in reader.pages:
            try:
                total_text += p.extract_text() or ""
            except Exception:
                pass

        if len(total_text.strip()) == 0:
            return "FAIL", ["PDF contains no extractable text"]

        if len(total_text.strip()) < 100:
            warnings.append(f"PDF has very little text ({len(total_text.strip())} chars) — may be corrupt")
            status = "WARN"

        if page_count > 25:
            warnings.append(f"PDF has {page_count} pages — consider reviewing quote size")
            if status == "PASS":
                status = "WARN"

    except Exception as e:
        warnings.append(f"Quality validation error: {str(e)}")
        status = "WARN"

    return status, warnings


# ═══════════════════════════════════════════════════════════════════════════════
#  Supabase upload
# ═══════════════════════════════════════════════════════════════════════════════

def _upload_pdf_to_supabase(pdf_bytes: bytes, storage_path: str) -> None:
    """Upload PDF bytes to the quote-pdfs Supabase bucket."""
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase credentials not configured")

    from supabase import create_client
    client = create_client(supabase_url, supabase_key)
    try:
        client.storage.from_("quote-pdfs").upload(
            path=storage_path,
            file=pdf_bytes,
            file_options={"content-type": "application/pdf"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF storage upload failed: {str(e)}")


def _get_signed_pdf_url(storage_path: str, expires: int = 300) -> str:
    """Generate a signed URL for a quote PDF."""
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase credentials not configured")

    from supabase import create_client
    client = create_client(supabase_url, supabase_key)
    try:
        signed = client.storage.from_("quote-pdfs").create_signed_url(
            path=storage_path, expires_in=expires
        )
        url = (
            signed.get("signedURL")
            or signed.get("signed_url")
            or (signed.get("data") or {}).get("signedUrl")
        )
        if not url:
            raise ValueError(f"No signed URL in response: {signed}")
        return url
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not generate signed URL: {str(e)}")


# ═══════════════════════════════════════════════════════════════════════════════
#  HTML Rendering
# ═══════════════════════════════════════════════════════════════════════════════

def _render_html(context: dict) -> str:
    tmpl = _JINJA_ENV.get_template("quote_pdf.html")
    return tmpl.render(**context)


def _html_to_pdf(html: str) -> bytes:
    """Convert HTML string to PDF bytes using xhtml2pdf."""
    try:
        from xhtml2pdf import pisa
    except ImportError:
        raise HTTPException(status_code=500, detail="xhtml2pdf not installed")

    buf = io.BytesIO()
    result = pisa.CreatePDF(
        src=io.StringIO(html),
        dest=buf,
        encoding="utf-8",
    )
    if result.err:
        raise HTTPException(
            status_code=500,
            detail=f"PDF rendering failed (xhtml2pdf error code {result.err})"
        )
    return buf.getvalue()


def _part_area_mm2_from_weight(material: str, thickness_mm: float, weight_kg: float) -> float:
    """Estimate true material area from part weight, material density, and thickness."""
    try:
        thickness = float(thickness_mm)
        weight = float(weight_kg)
    except Exception:
        return 0.0
    if thickness <= 0 or weight <= 0:
        return 0.0
    density = float(DENSITY.get(material, 7850) or 7850)
    return weight / (density * (thickness / 1000.0)) * 1_000_000.0


def _infer_part_footprint_mm(qi: QuoteItem, part_svg: str) -> tuple[float, float, float]:
    """
    Return (length, width, true_area) for nesting.
    New DXF SVGs carry real mm extents. Older cached SVGs still provide
    aspect ratio, so combine that with weight-derived physical area.
    """
    area_mm2 = _part_area_mm2_from_weight(qi.material, qi.thickness, qi.weight)
    geom_l, geom_w = svg_geometry_size(part_svg)

    if "data-geometry-width-mm" in (part_svg or "") and geom_l > 0 and geom_w > 0:
        return (round(geom_l, 2), round(geom_w, 2), area_mm2)

    if area_mm2 > 0 and geom_l > 0 and geom_w > 0:
        ratio = max(0.05, min(20.0, geom_l / geom_w))
        part_l = math.sqrt(area_mm2 * ratio)
        part_w = area_mm2 / part_l
        return (round(part_l, 2), round(part_w, 2), area_mm2)

    if geom_l > 0 and geom_w > 0:
        return (round(geom_l, 2), round(geom_w, 2), area_mm2)

    if area_mm2 > 0:
        side = math.sqrt(area_mm2)
        return (round(side, 2), round(side, 2), area_mm2)

    return (0.0, 0.0, 0.0)


def _sheet_for_part(part_l: float, part_w: float) -> tuple[str, float, float]:
    sheet_name = pick_sheet_for_part(part_l, part_w)
    sheet_l, sheet_w = STANDARD_SHEETS.get(sheet_name) or (1220, 2440)
    sheet_l, sheet_w = float(sheet_l), float(sheet_w)
    return (sheet_name, max(sheet_l, sheet_w), min(sheet_l, sheet_w))


# ═══════════════════════════════════════════════════════════════════════════════
#  Public API
# ═══════════════════════════════════════════════════════════════════════════════

PDF_ALLOWED_STATUSES = {"Approved", "Sent", "Accepted"}


def generate_quote_pdf(quote_id: int, db: Session, current_user: User) -> dict:
    """
    Full PDF generation pipeline.
    Returns {quote_id, quote_number, signed_url, version, generated_at,
             quality_status, warnings}
    Raises 404 / 400 / 422 / 500 on failure.
    """
    # ── 1. Load quote with all relationships ─────────────────────────────────
    quote = (
        db.query(Quote)
        .options(
            joinedload(Quote.customer),
            joinedload(Quote.rfq),
            joinedload(Quote.creator),
            joinedload(Quote.items).joinedload(QuoteItem.rfq_file),
        )
        .filter(Quote.id == quote_id)
        .first()
    )
    if not quote:
        raise HTTPException(status_code=404, detail=f"Quote {quote_id} not found")

    # ── 2. Status validation ──────────────────────────────────────────────────
    if quote.status not in PDF_ALLOWED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot generate PDF for quote in status '{quote.status}'. "
                   f"Allowed: {', '.join(sorted(PDF_ALLOWED_STATUSES))}"
        )

    # ── 3. Load settings ──────────────────────────────────────────────────────
    settings     = _get_all_settings(db)
    company      = _load_company_info(settings)
    validity_days = _get_validity_days(settings)
    terms        = _get_terms(settings)

    margin_pct = float(settings.get("default_margin_percent", 0))
    gst_pct    = float(settings.get("gst_percent", 18))

    # ── 4. Build items context with nesting SVGs ──────────────────────────────
    items_ctx = []
    for qi in quote.items:
        part_svg = ""
        nesting_png = ""
        part_preview_png = ""
        sheet_name = ""
        sheet_l = 0.0
        sheet_w = 0.0
        part_l = 0.0
        part_w = 0.0
        part_area = 0.0
        kerf = 2.0
        metrics = {
            "pcs": 0,
            "orientation": "",
            "util": 0.0,
            "waste": 0.0,
            "nested_area": 0.0,
            "waste_area": 0.0,
            "total_area": 0.0,
        }

        if qi.rfq_file_id and qi.rfq_file:
            part_svg = _get_or_generate_svg(qi.rfq_file, db) or ""
            print(f"[PDF] item={qi.part_name} rfq_file_id={qi.rfq_file_id} svg_len={len(part_svg)}", flush=True)
        elif qi.geometry_svg:
            part_svg = qi.geometry_svg
            print(f"[PDF] item={qi.part_name} using stored geometry_svg len={len(part_svg)}", flush=True)
        else:
            print(f"[PDF] item={qi.part_name} rfq_file_id=None geometry_svg=None — no SVG", flush=True)

        kerf = 2.0

        # Derive part dimensions: prefer real SVG geometry, fall back to weight-based estimate
        if part_svg:
            part_l, part_w, part_area = _infer_part_footprint_mm(qi, part_svg)
        else:
            part_l, part_w, part_area = 0.0, 0.0, 0.0

        # Weight-based fallback when SVG geometry is unavailable (e.g. PDF-only parts)
        if (part_l <= 5 or part_w <= 5) and qi.weight > 0 and qi.thickness > 0:
            density = 7.85e-3  # g/mm³ steel
            area_mm2 = (qi.weight * 1e6) / (qi.thickness * density * 1e3)
            ratio = 1.6  # typical sheet metal aspect ratio
            part_l = round(math.sqrt(area_mm2 / ratio), 1)
            part_w = round(part_l / ratio, 1)
            part_area = area_mm2

        if part_l > 5 and part_w > 5:
            sheet_name, sheet_l, sheet_w = _sheet_for_part(part_l, part_w)
            metrics = calculate_nesting_metrics(
                sheet_l=sheet_l,
                sheet_w=sheet_w,
                part_l=part_l,
                part_w=part_w,
                part_area=part_area,
                kerf=kerf,
            )
            # Only generate visual nesting diagram if we have real DXF geometry
            if part_svg:
                nesting_png = generate_nesting_diagram_base64(
                    sheet_l=sheet_l,
                    sheet_w=sheet_w,
                    part_l=part_l,
                    part_w=part_w,
                    qty=qi.quantity,
                    part_svg_str=part_svg,
                    kerf=kerf,
                )
                part_preview_png = render_part_preview_base64(part_svg)
        else:
            sheet_l, sheet_w = 0.0, 0.0

        if not nesting_png:
            metrics = {
                "pcs": metrics.get("pcs", 0) if part_l > 5 else 0,
                "orientation": metrics.get("orientation", ""),
                "util": metrics.get("util", 0.0),
                "waste": metrics.get("waste", 0.0),
                "nested_area": metrics.get("nested_area", 0.0),
                "waste_area": metrics.get("waste_area", 0.0),
                "total_area": sheet_l * sheet_w if sheet_l and sheet_w else 0.0,
            }

        items_ctx.append({
            "part_name":   qi.part_name,
            "drg_no":      qi.part_name,
            "material":    qi.material,
            "thickness":   qi.thickness,
            "quantity":    qi.quantity,
            "weight":      qi.weight,
            "part_total":  qi.part_total,
            "line_total":  qi.part_total * qi.quantity,
            "nesting_png": nesting_png,
            "part_preview_png": part_preview_png,
            "sheet_name": sheet_name,
            "sheet_l": sheet_l,
            "sheet_w": sheet_w,
            "part_l": part_l,
            "part_w": part_w,
            "kerf": kerf,
            "orientation": metrics["orientation"],
            "util": metrics["util"],
            "waste": metrics["waste"],
            "pcs": metrics["pcs"],
            "used_area": metrics["nested_area"],
            "waste_area": metrics["waste_area"],
            "total_area": metrics["total_area"],
        })

    # ── 5. Render HTML ─────────────────────────────────────────────────────────
    valid_until = (quote.created_at or datetime.utcnow()) + timedelta(days=validity_days)
    prepared_by = (
        quote.creator.email if quote.creator else "System"
    )

    # Attach valid_until for template access
    quote.valid_until = valid_until

    html_str = _render_html({
        "company":       company,
        "customer":      quote.customer,
        "rfq":           quote.rfq,
        "quote":         quote,
        "items":         items_ctx,
        "prepared_by":   prepared_by,
        "validity_days": validity_days,
        "valid_until":   valid_until,
        "terms":         terms,
        "margin_pct":    margin_pct,
        "gst_pct":       gst_pct,
    })

    # ── 6. Convert to PDF ─────────────────────────────────────────────────────
    pdf_bytes = _html_to_pdf(html_str)

    # ── 7. Quality validation ─────────────────────────────────────────────────
    quality_status, warnings = validate_pdf_quality(pdf_bytes)
    if quality_status == "FAIL":
        raise HTTPException(
            status_code=422,
            detail={
                "error":          "PDF quality validation failed — PDF not stored",
                "quality_status": "FAIL",
                "warnings":       warnings,
            },
        )

    # ── 8. Version and storage path ───────────────────────────────────────────
    new_version    = (quote.pdf_version or 0) + 1
    storage_path   = f"{quote.quote_number}-v{new_version}.pdf"

    # ── 9. Upload to Supabase ─────────────────────────────────────────────────
    _upload_pdf_to_supabase(pdf_bytes, storage_path)

    # ── 10. Update quote record ───────────────────────────────────────────────
    now = datetime.utcnow()
    quote.pdf_storage_path = storage_path
    quote.pdf_generated_at = now
    quote.pdf_version      = new_version

    # ── 11. Audit trail ───────────────────────────────────────────────────────
    audit_note = (
        f"PDF v{new_version} generated by {current_user.email} "
        f"[{quality_status}]"
        + (f" — warnings: {'; '.join(warnings)}" if warnings else "")
    )
    history = QuoteStatusHistory(
        quote_id=quote.id,
        old_status=quote.status,
        new_status=quote.status,   # status unchanged; this is just an audit event
        changed_by=current_user.id,
        notes=audit_note,
    )
    db.add(history)
    db.commit()

    # ── 12. Generate signed URL ───────────────────────────────────────────────
    signed_url = _get_signed_pdf_url(storage_path, expires=300)

    return {
        "quote_id":       quote.id,
        "quote_number":   quote.quote_number,
        "signed_url":     signed_url,
        "version":        new_version,
        "generated_at":   now.isoformat(),
        "quality_status": quality_status,
        "warnings":       warnings,
    }


def get_quote_pdf_url(quote_id: int, db: Session) -> dict:
    """
    Return a fresh signed URL for the latest PDF version of a quote.
    """
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail=f"Quote {quote_id} not found")

    if not quote.pdf_storage_path:
        raise HTTPException(
            status_code=404,
            detail=f"No PDF has been generated for quote {quote.quote_number} yet"
        )

    signed_url = _get_signed_pdf_url(quote.pdf_storage_path, expires=300)

    return {
        "signed_url":          signed_url,
        "version":             quote.pdf_version,
        "generated_at":        quote.pdf_generated_at.isoformat() if quote.pdf_generated_at else None,
        "expires_in_seconds":  300,
    }
