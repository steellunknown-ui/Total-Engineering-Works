"""PDF quotation-request / drawing parser.

Extracts material type and sheet thickness by:
  1. Pulling the text layer (fast, works for quotation-request PDFs).
  2. If the text layer is empty/sparse, rendering each page and running OCR
     via macOS Vision framework (ocrmac) — handles vector engineering
     drawings where titles are drawn as lines, not text.

Returns {material, thickness, missing, text_preview}. `missing` is the list
of fields that couldn't be parsed — the UI highlights those entries red.
"""
import re

HAS_PDF = False
PDF_BACKEND = ""
HAS_OCR = False

# Text-extraction backend.
try:
    import fitz as _fitz  # PyMuPDF
    HAS_PDF = True
    PDF_BACKEND = "pymupdf"
except Exception:
    try:
        import pypdf as _pypdf
        HAS_PDF = True
        PDF_BACKEND = "pypdf"
    except Exception:
        pass

# OCR engines. Tesseract is preferred when available (cross-platform, explicit
# user choice). Fall back to macOS Vision via ocrmac otherwise.
OCR_BACKEND = ""
try:
    import pytesseract as _pytess
    from PIL import Image as _PILImage
    # Force an explicit probe to confirm the tesseract binary is on PATH.
    _ = _pytess.get_tesseract_version()
    HAS_OCR = True
    OCR_BACKEND = "tesseract"
except Exception:
    try:
        from ocrmac import ocrmac as _ocrmac
        HAS_OCR = True
        OCR_BACKEND = "ocrmac"
    except Exception:
        pass


def _extract_text_layer(fp: str) -> str:
    if PDF_BACKEND == "pymupdf":
        doc = _fitz.open(fp)
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
        return text
    if PDF_BACKEND == "pypdf":
        r = _pypdf.PdfReader(fp)
        return "\n".join((p.extract_text() or "") for p in r.pages)
    return ""


def _ocr_image(path: str) -> str:
    if OCR_BACKEND == "tesseract":
        try:
            img = _PILImage.open(path)
            # PSM 6 = "Assume a single uniform block of text" — good default
            # for title blocks. Sparse-text mode (11) can work too but is
            # slower. Keep default OEM (LSTM).
            return _pytess.image_to_string(img, config="--psm 6")
        except Exception:
            return ""
    if OCR_BACKEND == "ocrmac":
        try:
            results = _ocrmac.OCR(path, recognition_level="accurate").recognize()
            return "\n".join(t[0] for t in results)
        except Exception:
            return ""
    return ""


def _ocr_progressive(fp: str, max_pages: int = 2):
    """Progressive OCR: run passes in order of cost, stop when both material
    and thickness have been found. Passes per page:
      1. Full page @ 300 DPI (fast ~2s, catches most PDFs)
      2. Bottom 35% crop @ 600 DPI (catches title blocks with small specs)
      3. Bottom 20% crop @ 600 DPI (narrower focus on the spec line)
    Yields text chunks as they're extracted so the caller can check for a
    full match after each pass and stop early.
    """
    if not (HAS_OCR and PDF_BACKEND == "pymupdf"):
        return
    import tempfile, os
    doc = _fitz.open(fp)
    try:
        for i, page in enumerate(doc):
            if i >= max_pages:
                return
            rect = page.rect
            passes = [
                (None, 300),                                   # full page
                ((0.00, 0.65, 1.00, 1.00), 600),               # bottom 35%
                ((0.00, 0.80, 1.00, 1.00), 600),               # bottom 20%
            ]
            for frac, dpi in passes:
                if frac is None:
                    pix = page.get_pixmap(dpi=dpi)
                else:
                    clip = _fitz.Rect(
                        rect.x0 + rect.width * frac[0],
                        rect.y0 + rect.height * frac[1],
                        rect.x0 + rect.width * frac[2],
                        rect.y0 + rect.height * frac[3])
                    pix = page.get_pixmap(clip=clip, dpi=dpi)
                tmp = tempfile.mktemp(suffix=".png"); pix.save(tmp)
                try:
                    yield _ocr_image(tmp)
                finally:
                    try: os.unlink(tmp)
                    except OSError: pass
    finally:
        doc.close()


def _extract_text_and_parse(fp: str) -> tuple[str, bool, str | None, float | None]:
    """Try the text layer first, then progressive OCR. Early-exit ONLY when
    both material AND thickness have been found via HIGH-CONFIDENCE patterns
    (explicit 'HR SKIN PASS', 'Thickness: X mm', etc.). A low-confidence
    material match from the IS-code fallback doesn't trigger early exit,
    because a later OCR pass may upgrade it to a clean 'HR SKIN PASS' hit.
    """
    text = _extract_text_layer(fp)
    if len(text.strip()) >= 50:
        mat, high_conf = _detect_material_detailed(text)
        th = _detect_thickness(text)
        if mat and high_conf and th is not None:
            return text, False, mat, th
        accumulated = text
    else:
        accumulated = ""

    for chunk in _ocr_progressive(fp):
        if not chunk:
            continue
        accumulated = (accumulated + "\n" + chunk) if accumulated else chunk
        mat, high_conf = _detect_material_detailed(accumulated)
        th = _detect_thickness(accumulated)
        if mat and high_conf and th is not None:
            return accumulated, True, mat, th

    # Ran all passes — return whatever we accumulated (may be IS-code fallback).
    mat = _detect_material(accumulated)
    th = _detect_thickness(accumulated)
    return accumulated, bool(accumulated) and accumulated != text, mat, th


# ── Material detection ────────────────────────────────────────────
_MAT_KEYWORD_TO_CANONICAL = {
    "CRCA": "CRCA",
    "CR SHEET": "CR Sheet", "CR-SHEET": "CR Sheet", "CRSHEET": "CR Sheet",
    "HR SHEET": "HR Sheet", "HR-SHEET": "HR Sheet", "HRSHEET": "HR Sheet",
    "MS SHEET": "MS Sheet", "MS-SHEET": "MS Sheet", "MSSHEET": "MS Sheet",
    "GI SHEET": "GI Sheet", "GI-SHEET": "GI Sheet", "GISHEET": "GI Sheet",
    "CR": "CR Sheet", "HR": "HR Sheet", "MS": "MS Sheet", "GI": "GI Sheet",
}


# AutoCAD MTEXT formatting codes — stripped before material detection.
# IMPORTANT: patterns must be narrow. An earlier version used `\\[L...][^;]*;`
# which greedily swallowed hundreds of characters when `\L` appeared as the
# start of a real word (e.g. "\LBRACKET") and the next ';' was far away.
# Now each code has a specific, bounded pattern.
_ACAD_FORMAT_RE = re.compile(
    r"\\[PpLlOoKk]"                         # paragraph / under / over / strike toggles
    r"|\\[fF][^;]{1,80};"                    # font spec  \fCalibri|b0|i0;
    r"|\\[HhWwQqCcTt][0-9.]+;"               # scalar codes \H3.0000; \W0.8;
    r"|\\pxsm[0-9.]+;"                       # paragraph-size  \pxsm0.94;
    r"|\\A[0-9]+;"                           # alignment \A1;
    r"|\{|\}",                                # grouping braces
    re.IGNORECASE)


def _strip_acad_formatting(text: str) -> str:
    if not text:
        return text
    return _ACAD_FORMAT_RE.sub(" ", text)


def _detect_material_detailed(text: str) -> tuple[str | None, bool]:
    """Returns (material, high_confidence). A low-confidence match (from the
    IS-code fallback or a bare 2-letter abbreviation) should NOT trigger
    the progressive-OCR early exit, because a later pass might catch an
    explicit 'HR SKIN PASS' and upgrade the answer.
    """
    mat = _detect_material(text)
    if mat is None:
        return None, False
    # Re-check whether this match came from an explicit pattern.
    t = text.upper()
    high_conf_patterns = [
        r"\bCR\s+SKIN\s+PASS\b", r"\bHR\s+SKIN\s+PASS\b", r"\bMS\s+HR\b",
        r"\bGALVANI[SZ]ED?\b", r"\bZINC[\s\-]*(COAT|PLAT)",
        r"\bCOLD[\s\-]ROLLED\s+(CLOSED\s+)?ANNEAL",
        r"\bCR\s*SHEET\b", r"\bHR\s*SHEET\b", r"\bMS\s*SHEET\b",
        r"\bGI\s*SHEET\b", r"\bCRCA\b",
        r"\bSS[\s\-]?304\b", r"\bSTAINLESS\s+STEEL\s+304\b",
        r"\bALUMIN", r"\bMILD\s+STEEL\b",
    ]
    high_conf = any(re.search(p, t) for p in high_conf_patterns)
    return mat, high_conf


def _detect_material(text: str) -> str | None:
    # Strip AutoCAD formatting codes first so patterns below see clean text.
    text = _strip_acad_formatting(text)
    t = text.upper()
    # Also collapse dot-separated abbreviations so 'C.R.C.A.' → 'CRCA',
    # 'H.R.S.' → 'HRS', 'M.S.' → 'MS'.
    t_nodots = re.sub(r"\b([A-Z])\.", r"\1", t)

    # Priority: explicit material names win over standard codes. A drawing
    # might say "HR SKIN PASS" (the actual material) alongside "IS:513"
    # (the delivery-spec standard) — the explicit name is authoritative.

    # 1. Most specific: explicit drawing-shop shorthand.
    if re.search(r"\bCR\s+SKIN\s+PASS\b", t_nodots):
        return "CR Sheet"
    if re.search(r"\bHR\s+SKIN\s+PASS\b", t_nodots) or re.search(r"\bMS\s+HR\b", t_nodots):
        return "HR Sheet"
    # CRCA written as 'C.R.C.A.' (dot-separated) on older drawings.
    if re.search(r"\bCRCA\b", t_nodots):
        return "CRCA"
    # HRS / HRC / HRSS — Hot-Rolled Steel abbreviations (with or without periods).
    if re.search(r"\bHR[SC]\b|\bHR[\s\-]?S\b|\bHRS\s+SHEET\b", t_nodots):
        return "HR Sheet"
    if re.search(r"\bGALVANI[SZ]ED?\b|\bZINC[\s\-]*(COAT|PLAT)", t_nodots):
        return "GI Sheet"
    if re.search(r"\bCOLD[\s\-]ROLLED\s+(CLOSED\s+)?ANNEAL", t_nodots):
        return "CRCA"
    # 'MS' preceded by 'MATL:' or as standalone material callout like
    # 'MATL: 3THKx25x148 Lg M.S.' or 'Steel, Mild'.
    if re.search(r"\bMATL\s*:?\s*.*\bMS\b", t_nodots) or \
       re.search(r"\bSTEEL\s*,?\s*MILD\b|\bMILD\s+STEEL\b", t_nodots):
        return "MS Sheet"

    # 2. "Material:" label — check same line AND next ~100 chars since drawings
    # often put the label on one line and the value below it.
    m = re.search(
        r"\b(?:MATERIAL|WERKSTOFF|MATE|MATL|MAT)\s*"
        r"(?:TYPE|GRADE|SPEC|NO\.?)?\s*[:\-–=]?\s*([\s\S]{0,200})",
        t)
    if m:
        snippet = m.group(1)[:200]
        for pat, mat in [
            (r"\bCR\s+SKIN\s+PASS\b", "CR Sheet"),
            (r"\bHR\s+SKIN\s+PASS\b", "HR Sheet"),
            (r"\bCR\s*SHEET\b", "CR Sheet"),
            (r"\bHR\s*SHEET\b", "HR Sheet"),
            (r"\bMS\s*SHEET\b", "MS Sheet"),
            (r"\bGI\s*SHEET\b", "GI Sheet"),
            (r"\bCRCA\b", "CRCA"),
        ]:
            if re.search(pat, snippet):
                return mat

    # 3. Long-form material names anywhere in the document.
    for pat, mat in [
        (r"\bCR\s*SHEET\b", "CR Sheet"),
        (r"\bHR\s*SHEET\b", "HR Sheet"),
        (r"\bMS\s*SHEET\b", "MS Sheet"),
        (r"\bGI\s*SHEET\b", "GI Sheet"),
        (r"\bCRCA\b", "CRCA"),
        (r"\bSS[\s\-]?304\b|\bSTAINLESS\s+STEEL\s+304\b", "SS-304"),
        (r"\bALUMIN(I?UM|IUM)\b", "AL"),
        (r"\bMILD\s+STEEL\b", "MS Sheet"),
    ]:
        if re.search(pat, t_nodots):
            return mat

    # 4. IS-code fallback — weaker signal. Often just the delivery standard,
    # not the actual material grade. Only consulted if no explicit name found.
    if re.search(r"\b(?:IS|15)[\s:\-.]*2062\b", t):
        return "HR Sheet"
    if re.search(r"\b(?:IS|15)[\s:\-.]*277\b", t):
        return "GI Sheet"
    if re.search(r"\b(?:IS|15)[\s:\-.]*513\b", t):
        return "CRCA"

    # 5. Last resort: bare 2-letter abbreviation.
    for key in ("CR", "HR", "MS", "GI"):
        if re.search(rf"\b{key}\b", t):
            return _MAT_KEYWORD_TO_CANONICAL[key]

    return None


# ── Thickness detection ───────────────────────────────────────────
# Drawings write thickness in many orders — `THK: 2mm`, `2mm THK`, `2mm thk.`,
# `Thk 2`, or with label/value on adjacent lines. Rather than listing every
# regex, detect by PROXIMITY: find all "X mm" numbers and all "thk"-like
# labels, then return the mm number closest to a label within a window.
_THK_LABEL_RE = re.compile(
    r"\b(THICKNESS|THK|THICK|GAUGE|GAGE)\b\.?", re.IGNORECASE)
_MM_NUM_RE = re.compile(
    r"([0-9]+(?:\.[0-9]+)?)\s*(MM|M\.?M\.?)\b\.?", re.IGNORECASE)


def _detect_thickness(text: str) -> float | None:
    # Sheet-metal gauges are realistically 0.3–25 mm for structural parts.
    # Old limit of 6.0 was too tight for thick plate fabrication.
    PLAUSIBLE = (0.3, 25.0)

    def _is_sheet_gauge(v: float) -> bool:
        return PLAUSIBLE[0] <= v <= PLAUSIBLE[1]

    # Context words that indicate an mm number is NOT the sheet thickness —
    # e.g., "Bend radius = 2 mm" is about the bend, not the gauge.
    _NEGATIVE_CONTEXT = re.compile(
        r"\b(RADIUS|BIEGERADIUS|BEND|BA|BEND\s*ALLOW|DIA|DIAMETER|"
        r"FILLET|CLEAR\w*|GAP|KERF)\b", re.IGNORECASE)

    def _has_negative_context(nstart: int) -> bool:
        # Look for a disqualifying word on the SAME LINE as the number,
        # to the left. Crossing a newline breaks the context link — a
        # "Bend radius = 2 mm" on one line doesn't disqualify a "2mm thk"
        # on the next line.
        window = text[max(0, nstart - 60): nstart]
        # Truncate at the last newline so we only look at the current line.
        last_nl = window.rfind('\n')
        if last_nl != -1:
            window = window[last_nl + 1:]
        return bool(_NEGATIVE_CONTEXT.search(window))

    # 0. Indian engineering drawing material-spec strings (highest priority):
    #    "2 THK X 80 X 91 Lg. CRCA"   → thickness = 2
    #    "2 THK X 80 X 91"            → thickness = 2  
    #    "3X60X167 Lg HRS SHEET"      → thickness = 3
    #    "2.0 THK X 300 X 400"        → thickness = 2.0
    for spec_pat in [
        # "N THK X W X L" — thickness is the number BEFORE 'THK'
        r"\b([0-9]+(?:\.[0-9]+)?)\s+THK\s*[xX]",
        r"\b([0-9]+(?:\.[0-9]+)?)\s*THK\s*[xX]",
        # "NxWxL" where N is a small gauge and W,L are bigger dims
        # e.g. "3X60X167" — grab first number if it's < 25 and W/L > 25
        r"\b([0-9]+(?:\.[0-9]+)?)\s*[xX]\s*([0-9]+(?:\.[0-9]+)?)\s*[xX]\s*([0-9]+(?:\.[0-9]+)?)",
    ]:
        m = re.search(spec_pat, text, re.IGNORECASE)
        if m:
            try:
                v = float(m.group(1))
                if _is_sheet_gauge(v):
                    # For NxWxL pattern, verify W and L are both larger than thickness
                    if m.lastindex >= 3:
                        w2 = float(m.group(2))
                        w3 = float(m.group(3))
                        if w2 > v and w3 > v:
                            return v
                    else:
                        return v
            except (ValueError, IndexError):
                pass

    # 1. Sheet specification string "2.0 × 1250 × 2500" — authoritative.
    # First number is the gauge; next two are sheet dims.
    m = re.search(
        r"\b([0-9]+(?:\.[0-9]+)?)\s*[×xX]\s*1[02-5]\d{2}\s*[×xX]\s*[12]\d{3}",
        text)
    if m:
        try:
            v = float(m.group(1))
            if _is_sheet_gauge(v):
                return v
        except ValueError:
            pass

    # 2. Proximity match near a THK label, filtered to plausible gauges.
    # Collect all candidates, then pick the one closest to a THK label that
    # is BOTH in the plausible range AND not in a negative context.
    labels = [(m.start(), m.end()) for m in _THK_LABEL_RE.finditer(text)]
    numbers = []
    for m in _MM_NUM_RE.finditer(text):
        try:
            v = float(m.group(1))
        except ValueError:
            continue
        if not _is_sheet_gauge(v):
            continue
        if _has_negative_context(m.start()):
            continue
        numbers.append((v, m.start(), m.end()))

    if labels and numbers:
        best_v, best_dist = None, 10**9
        for lstart, lend in labels:
            for v, nstart, nend in numbers:
                if nstart >= lend:
                    d = nstart - lend       # "thk 2mm"
                elif nend <= lstart:
                    d = lstart - nend       # "2mm thk"
                else:
                    d = 0
                if d < best_dist:
                    best_dist = d; best_v = v
        if best_v is not None and best_dist <= 60:
            return best_v

    # 3. Labelled form "T = 2 mm" or "T = 2" (plausible gauges only).
    for t_pat in [
        r"\bT\s*[=:]\s*([0-9]+(?:\.[0-9]+)?)\s*MM\b",
        r"\bT\s*[=:]\s*([0-9]+(?:\.[0-9]+)?)(?:\s|$)",
    ]:
        m = re.search(t_pat, text, re.IGNORECASE)
        if m:
            try:
                v = float(m.group(1))
                if _is_sheet_gauge(v):
                    return v
            except ValueError:
                pass

    # 4. Title-block fallback — any plausible "X mm" in first 800 chars
    # NOT in a negative context.
    for m in _MM_NUM_RE.finditer(text[:800]):
        try:
            v = float(m.group(1))
        except ValueError:
            continue
        if not _is_sheet_gauge(v):
            continue
        if _has_negative_context(m.start()):
            continue
        return v

    # Nothing plausible — better to return None and let the operator type
    # the value manually than return a wrong OCR artifact.
    return None


def _detect_process_from_text(text: str) -> str:
    """Scan free text (OCR output) for a process keyword. Delegates to the
    shared matcher in fab_grouper so PDF, DXF, and description scans all
    use identical rules. Silent on missing text."""
    if not text:
        return ""
    try:
        from core.fab_grouper import _match_process_keyword
    except Exception:
        return ""
    return _match_process_keyword(text)


# Match a "DRG. NO. : <value>" / "DRAWING NUMBER <value>" / "DWG NO <value>"
# pattern.  The value side stops at whitespace, newline, comma, or end.
_PDF_DRG_RE = re.compile(
    r"(?:DR?\.?W?G\.?\s*(?:NO\.?|NUMBER|#)|DRAWING\s*(?:NO\.?|NUMBER|#))\s*:?\s*"
    r"([A-Z0-9][A-Z0-9\-_/.]{2,28}[A-Z0-9])",
    re.IGNORECASE,
)


def _extract_drg_no_from_text(text: str) -> str:
    """Best-effort drawing-number scan over the entire PDF text (or OCR
    output). Returns '' if nothing convincing was found."""
    if not text:
        return ""
    try:
        from core.fab_grouper import _looks_like_drg_no
    except Exception:
        _looks_like_drg_no = lambda v: bool(v and len(v) >= 3)
    for m in _PDF_DRG_RE.finditer(text):
        cand = m.group(1).strip(" .,:-")
        if _looks_like_drg_no(cand):
            return cand
    return ""


def _extract_dimensions(text: str) -> dict:
    result = {"thickness_mm": None, "width_mm": None, "length_mm": None, "material": None}
    if not text:
        return result
        
    # Standardize string for easier matching
    s = text.replace('\n', ' ')
    
    # Try pattern 1: {T}THKx{W}x{L}Lg or {T}THK x {W} x {L}
    m = re.search(r"\b([0-9.]+)\s*THK\s*[xX]\s*([0-9.]+)\s*[xX]\s*([0-9.]+)(?:\s*L[gG])?\s*([A-Za-z\s]+)?", s, re.IGNORECASE)
    if m:
        try:
            result["thickness_mm"] = float(m.group(1))
            result["width_mm"] = float(m.group(2))
            result["length_mm"] = float(m.group(3))
            mat_str = (m.group(4) or "").strip()
            if mat_str:
                if "HRS" in mat_str.upper() or "HR" in mat_str.upper():
                    result["material"] = "HR Sheet"
                elif "CR" in mat_str.upper():
                    result["material"] = "CR Sheet"
                elif "SS" in mat_str.upper():
                    result["material"] = "SS Sheet"
                elif "AL" in mat_str.upper():
                    result["material"] = "Aluminium"
                elif "GI" in mat_str.upper():
                    result["material"] = "GI Sheet"
                elif "MS" in mat_str.upper():
                    result["material"] = "MS Sheet"
                else:
                    result["material"] = mat_str
            return result
        except ValueError:
            pass
            
    # Pattern 2: {L}x{W}x{T}thk
    m = re.search(r"\b([0-9.]+)\s*[xX]\s*([0-9.]+)\s*[xX]\s*([0-9.]+)\s*THK", s, re.IGNORECASE)
    if m:
        try:
            result["length_mm"] = float(m.group(1))
            result["width_mm"] = float(m.group(2))
            result["thickness_mm"] = float(m.group(3))
            return result
        except ValueError:
            pass
            
    # Pattern 3: T={T}, {L}x{W}
    m = re.search(r"\bT\s*=\s*([0-9.]+)[,\s]+([0-9.]+)\s*[xX]\s*([0-9.]+)", s, re.IGNORECASE)
    if m:
        try:
            result["thickness_mm"] = float(m.group(1))
            result["length_mm"] = float(m.group(2))
            result["width_mm"] = float(m.group(3))
            return result
        except ValueError:
            pass
            
    # Fallback to general L= W=
    m = re.search(r"\bL(?:ENGTH)?\s*[:=]\s*([0-9.]+).*?\bW(?:IDTH)?\s*[:=]\s*([0-9.]+)", s, re.IGNORECASE)
    if m:
        try:
            result["length_mm"] = float(m.group(1))
            result["width_mm"] = float(m.group(2))
        except ValueError:
            pass

    return result

def _extract_vector_bbox(fp: str) -> tuple[float|None, float|None]:
    try:
        if PDF_BACKEND != "pymupdf":
            return None, None
        import fitz
        doc = fitz.open(fp)
        for page in doc:
            paths = page.get_drawings()
            if not paths: continue
            bboxes = [p['rect'] for p in paths if p['rect'].width > 0 and p['rect'].height > 0]
            if not bboxes: continue
            x0 = min(b.x0 for b in bboxes)
            y0 = min(b.y0 for b in bboxes)
            x1 = max(b.x1 for b in bboxes)
            y1 = max(b.y1 for b in bboxes)
            w = (x1 - x0) * 25.4 / 72
            h = (y1 - y0) * 25.4 / 72
            # Return max as length, min as width
            return round(max(w, h), 2), round(min(w, h), 2)
    except Exception:
        pass
    return None, None


def read_pdf(fp: str) -> dict:
    """Parse material + thickness + process hint + drawing-no from a PDF."""
    if not HAS_PDF:
        raise RuntimeError("No PDF library installed. Run: pip install pymupdf")

    text, used_ocr, material, thickness = _extract_text_and_parse(fp)
    process = _detect_process_from_text(text)
    drg_no = _extract_drg_no_from_text(text)
    
    dims = _extract_dimensions(text)
    dim_t = dims.get("thickness_mm")
    dim_w = dims.get("width_mm")
    dim_l = dims.get("length_mm")
    dim_mat = dims.get("material")

    if dim_mat and not material:
        material = dim_mat
    if dim_t is not None and not thickness:
        thickness = dim_t
        
    dim_l_final = dim_l
    dim_w_final = dim_w
    if dim_l is None or dim_w is None:
        vw, vl = _extract_vector_bbox(fp)
        if vl is not None:
            dim_l_final = vl
            dim_w_final = vw

    missing = []
    if not material:
        missing.append("Material")
    if not thickness:
        missing.append("Thickness")

    return {
        "material": material,
        "thickness_mm": thickness,
        "length_mm": dim_l_final if dim_l_final is not None else 0.0,
        "width_mm": dim_w_final if dim_w_final is not None else 0.0,
        "process": process,
        "drg_no": drg_no,
        "missing_fields": missing,
        "used_ocr": used_ocr,
        "text_preview": text[:500].replace("\n", " ").strip(),
    }
