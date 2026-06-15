"""
dxf_svg_service.py — Phase 7A
=================================
DXF → real SVG geometry converter + nesting diagram builder + PyMuPDF rasterizer.
"""
import math
import os
import html
import base64
import re

try:
    import ezdxf
    from ezdxf import bbox as ezdxf_bbox
    HAS_EZDXF = True
except ImportError:
    HAS_EZDXF = False

try:
    import fitz  # PyMuPDF
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False


# ─── Color palette ─────────────────────────────────────────────────────────────
_COLOR_CUT   = "#1e3a5f"   # outer cuts and lines
_COLOR_BEND  = "#c2410c"   # bend / fold lines (dashed)
_COLOR_HOLE  = "#991b1b"   # circles / holes
_COLOR_SHEET_FILL  = "#ffffff"   # sheet background
_COLOR_WASTE_FILL  = "#fcfcfc"   # waste area fill
_COLOR_SHEET_BORDER= "#1a1a1a"   # sheet outer border
_COLOR_HATCH       = "#e5e7eb"   # waste hatch lines


def _layer_color(layer: str) -> tuple[str, bool]:
    """Return (stroke_color, is_dashed) based on layer name."""
    u = layer.upper()
    if any(k in u for k in ("BEND", "FOLD", "SCORE", "CREASE")):
        return _COLOR_BEND, True
    if any(k in u for k in ("HOLE", "PUNCH", "BORE")):
        return _COLOR_HOLE, False
    return _COLOR_CUT, False


def dxf_to_svg(dxf_path: str, target_width: int = 380) -> str:
    """Read a DXF file and produce a self-contained inline SVG string."""
    if not HAS_EZDXF: return ""
    try: doc = ezdxf.readfile(dxf_path)
    except Exception: return ""

    msp = doc.modelspace()
    all_xs, all_ys = [], []

    try:
        ext = ezdxf_bbox.extents(msp)
        if ext.has_data:
            all_xs += [ext.extmin.x, ext.extmax.x]
            all_ys += [ext.extmin.y, ext.extmax.y]
    except Exception: pass

    if not all_xs:
        for e in msp:
            try:
                et = e.dxftype()
                if et == "LINE":
                    s, en = e.dxf.start, e.dxf.end
                    all_xs += [s.x, en.x]; all_ys += [s.y, en.y]
                elif et in ("ARC", "CIRCLE"):
                    c, r = e.dxf.center, e.dxf.radius
                    all_xs += [c.x - r, c.x + r]; all_ys += [c.y - r, c.y + r]
                elif et == "LWPOLYLINE":
                    for p in e.get_points(format="xy"):
                        all_xs.append(p[0]); all_ys.append(p[1])
                elif et == "POLYLINE":
                    for v in e.vertices:
                        loc = v.dxf.location
                        all_xs.append(loc.x); all_ys.append(loc.y)
            except Exception: continue

    if not all_xs or not all_ys: return ""

    bbox_minx, bbox_miny = min(all_xs), min(all_ys)
    bbox_maxx, bbox_maxy = max(all_xs), max(all_ys)
    bbox_w = bbox_maxx - bbox_minx or 1.0
    bbox_h = bbox_maxy - bbox_miny or 1.0

    scale = target_width / bbox_w
    svg_w, svg_h = target_width, bbox_h * scale

    def tx(x: float) -> float: return (x - bbox_minx) * scale
    def ty(y: float) -> float: return (bbox_maxy - y) * scale

    PAD = 4
    svg_w += PAD * 2; svg_h += PAD * 2
    lines = []

    for e in msp:
        try:
            et = e.dxftype()
            layer = getattr(e.dxf, "layer", "0") or "0"
            color, dashed = _layer_color(layer)
            dash_attr = ' stroke-dasharray="4,3"' if dashed else ""

            if et == "LINE":
                s, en = e.dxf.start, e.dxf.end
                lines.append(f'<line x1="{tx(s.x)+PAD:.2f}" y1="{ty(s.y)+PAD:.2f}" x2="{tx(en.x)+PAD:.2f}" y2="{ty(en.y)+PAD:.2f}" stroke="{color}" stroke-width="1.2"{dash_attr}/>')

            elif et == "ARC":
                dxf_cy, r_svg = e.dxf.center.y, e.dxf.radius * scale
                sa, ea = math.radians(e.dxf.start_angle), math.radians(e.dxf.end_angle)
                sweep = e.dxf.end_angle - e.dxf.start_angle
                if sweep < 0: sweep += 360
                large = 1 if sweep > 180 else 0
                x1s = tx(e.dxf.center.x + e.dxf.radius * math.cos(sa)) + PAD
                y1s = ty(dxf_cy + e.dxf.radius * math.sin(sa)) + PAD
                x2s = tx(e.dxf.center.x + e.dxf.radius * math.cos(ea)) + PAD
                y2s = ty(dxf_cy + e.dxf.radius * math.sin(ea)) + PAD
                lines.append(f'<path d="M {x1s:.2f} {y1s:.2f} A {r_svg:.2f} {r_svg:.2f} 0 {large} 0 {x2s:.2f} {y2s:.2f}" stroke="{color}" stroke-width="1.2" fill="none"{dash_attr}/>')

            elif et == "CIRCLE":
                lines.append(f'<circle cx="{tx(e.dxf.center.x)+PAD:.2f}" cy="{ty(e.dxf.center.y)+PAD:.2f}" r="{e.dxf.radius*scale:.2f}" stroke="{_COLOR_HOLE}" stroke-width="1" fill="none"/>')

            elif et == "LWPOLYLINE":
                pts = list(e.get_points(format="xy"))
                if not pts: continue
                pt_str = " ".join(f"{tx(p[0])+PAD:.2f},{ty(p[1])+PAD:.2f}" for p in pts)
                tag = "polygon" if e.closed else "polyline"
                lines.append(f'<{tag} points="{pt_str}" stroke="{color}" stroke-width="1.2" fill="none"{dash_attr}/>')

            elif et == "POLYLINE":
                pts = [(v.dxf.location.x, v.dxf.location.y) for v in e.vertices]
                if not pts: continue
                pt_str = " ".join(f"{tx(p[0])+PAD:.2f},{ty(p[1])+PAD:.2f}" for p in pts)
                tag = "polygon" if e.is_closed else "polyline"
                lines.append(f'<{tag} points="{pt_str}" stroke="{color}" stroke-width="1.2" fill="none"{dash_attr}/>')
        except Exception: continue

    if not lines: return ""
    svg_body = "\n  ".join(lines)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {svg_w:.2f} {svg_h:.2f}" '
        f'data-geometry-width-mm="{bbox_w:.3f}" '
        f'data-geometry-height-mm="{bbox_h:.3f}" '
        f'style="max-width:100%;height:auto;display:block;" '
        f'preserveAspectRatio="xMidYMid meet">\n'
        f'  <rect width="{svg_w:.2f}" height="{svg_h:.2f}" fill="white" stroke="none"/>\n'
        f'  {svg_body}\n'
        f'</svg>'
    )


def _svg_attr_float(svg_str: str, attr: str) -> float:
    if not svg_str:
        return 0.0
    m = re.search(rf'{attr}="([-+0-9.]+)"', svg_str)
    if not m:
        return 0.0
    try:
        return float(m.group(1))
    except ValueError:
        return 0.0


def _parse_view_box(svg_str: str) -> tuple[float, float, float, float]:
    if not svg_str:
        return (0.0, 0.0, 0.0, 0.0)
    m = re.search(r'viewBox="([^"]+)"', svg_str)
    if not m:
        return (0.0, 0.0, 0.0, 0.0)
    try:
        nums = [float(x) for x in re.split(r"[\s,]+", m.group(1).strip()) if x]
    except ValueError:
        return (0.0, 0.0, 0.0, 0.0)
    if len(nums) != 4:
        return (0.0, 0.0, 0.0, 0.0)
    return (nums[0], nums[1], nums[2], nums[3])


def svg_geometry_size(svg_str: str) -> tuple[float, float]:
    """
    Return the DXF geometry footprint in mm when available.
    Falls back to the SVG viewBox size, which preserves aspect ratio for
    older cached SVGs that do not have geometry metadata.
    """
    w = _svg_attr_float(svg_str, "data-geometry-width-mm")
    h = _svg_attr_float(svg_str, "data-geometry-height-mm")
    if w > 0 and h > 0:
        return (w, h)
    _x, _y, vb_w, vb_h = _parse_view_box(svg_str)
    return (vb_w, vb_h)


def extract_inner_svg(svg_str: str) -> str:
    """Extracts everything inside the <svg> tags."""
    if not svg_str: return ""
    match = re.search(r"<svg\b[^>]*>(.*)</svg>", svg_str, re.IGNORECASE | re.DOTALL)
    if not match:
        return ""
    inner = match.group(1).strip()
    # Drop only the white SVG background inserted by dxf_to_svg; keep real DXF geometry.
    inner = re.sub(
        r'^\s*<rect\b(?=[^>]*fill="white")(?=[^>]*stroke="none")[^>]*/>\s*',
        "",
        inner,
        flags=re.IGNORECASE,
    )
    return inner


def _rasterize_svg_base64(svg_str: str, target_width_px: int = 1500) -> str:
    if not HAS_FITZ or not svg_str:
        return ""
    try:
        svg_bytes = svg_str.encode("utf-8")
        doc = fitz.open("svg", svg_bytes)
        page = doc[0]
        page_w = max(float(page.rect.width), 1.0)
        page_h = max(float(page.rect.height), 1.0)
        # Cap zoom to prevent excessive memory usage on very large SVGs
        zoom = max(0.1, min(4.0, target_width_px / page_w))
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
        png_bytes = pix.tobytes("png")
        doc.close()
        return base64.b64encode(png_bytes).decode("utf-8")
    except Exception as e:
        print(f"[NESTING] SVG rasterize error: {type(e).__name__}: {e}")
        print(f"[NESTING] SVG length: {len(svg_str)}, target_width: {target_width_px}")
        return ""


def render_part_preview_base64(part_svg_str: str, target_width_px: int = 420) -> str:
    """Rasterize a single DXF SVG for the orientation key panel."""
    return _rasterize_svg_base64(part_svg_str, target_width_px=target_width_px)


def _grid_count(area_len: float, area_wid: float, part_len: float, part_wid: float, kerf: float) -> tuple[int, int]:
    if area_len <= 0 or area_wid <= 0 or part_len <= 0 or part_wid <= 0:
        return (0, 0)
    cols = int((area_len + kerf) // (part_len + kerf))
    rows = int((area_wid + kerf) // (part_wid + kerf))
    return (max(0, cols), max(0, rows))


def _add_grid_placements(
    placements: list[tuple[float, float, float, float, bool]],
    start_x: float,
    start_y: float,
    part_len: float,
    part_wid: float,
    cols: int,
    rows: int,
    kerf: float,
    rotated: bool,
) -> None:
    for row in range(rows):
        for col in range(cols):
            placements.append((
                start_x + col * (part_len + kerf),
                start_y + row * (part_wid + kerf),
                part_len,
                part_wid,
                rotated,
            ))


def _build_nesting_layout(
    sheet_l: float,
    sheet_w: float,
    part_l: float,
    part_w: float,
    kerf: float,
    margin: float,
) -> tuple[list[tuple[float, float, float, float, bool]], str]:
    usable_l = max(0.0, sheet_l - 2 * margin)
    usable_w = max(0.0, sheet_w - 2 * margin)

    plans: list[tuple[int, str, list[tuple[float, float, float, float, bool]]]] = []

    n_cols, n_rows = _grid_count(usable_l, usable_w, part_l, part_w, kerf)
    normal: list[tuple[float, float, float, float, bool]] = []
    _add_grid_placements(normal, margin, margin, part_l, part_w, n_cols, n_rows, kerf, False)
    plans.append((len(normal), "Normal", normal))

    r_cols, r_rows = _grid_count(usable_l, usable_w, part_w, part_l, kerf)
    rotated: list[tuple[float, float, float, float, bool]] = []
    _add_grid_placements(rotated, margin, margin, part_w, part_l, r_cols, r_rows, kerf, True)
    plans.append((len(rotated), "Rotated 90", rotated))

    mixed_a = list(normal)
    normal_used_l = n_cols * part_l + max(0, n_cols - 1) * kerf
    leftover_l = max(0.0, usable_l - normal_used_l - kerf)
    ex_cols, ex_rows = _grid_count(leftover_l, usable_w, part_w, part_l, kerf)
    if ex_cols and ex_rows:
        _add_grid_placements(
            mixed_a,
            margin + normal_used_l + kerf,
            margin,
            part_w,
            part_l,
            ex_cols,
            ex_rows,
            kerf,
            True,
        )

    mixed_b = list(rotated)
    rot_used_l = r_cols * part_w + max(0, r_cols - 1) * kerf
    leftover_l2 = max(0.0, usable_l - rot_used_l - kerf)
    ex2_cols, ex2_rows = _grid_count(leftover_l2, usable_w, part_l, part_w, kerf)
    if ex2_cols and ex2_rows:
        _add_grid_placements(
            mixed_b,
            margin + rot_used_l + kerf,
            margin,
            part_l,
            part_w,
            ex2_cols,
            ex2_rows,
            kerf,
            False,
        )

    mixed = mixed_a if len(mixed_a) >= len(mixed_b) else mixed_b
    plans.append((len(mixed), "Mixed", mixed))

    best_count, best_name, best_places = max(plans, key=lambda p: p[0])
    if best_count <= 0:
        return ([], "")
    return (best_places, best_name)


def calculate_nesting_metrics(
    sheet_l: float,
    sheet_w: float,
    part_l: float,
    part_w: float,
    part_area: float | None = None,
    kerf: float = 2.0,
) -> dict:
    """Return sheet metrics using the same placement logic as the renderer."""
    if sheet_l <= 0 or sheet_w <= 0 or part_l <= 0 or part_w <= 0:
        return {
            "pcs": 0,
            "orientation": "",
            "util": 0.0,
            "waste": 100.0,
            "nested_area": 0.0,
            "waste_area": sheet_l * sheet_w if sheet_l > 0 and sheet_w > 0 else 0.0,
            "total_area": sheet_l * sheet_w if sheet_l > 0 and sheet_w > 0 else 0.0,
        }
    disp_kerf = max(float(kerf), 0.5)
    margin = max(disp_kerf, min(sheet_l, sheet_w) * 0.01)
    placements, orientation = _build_nesting_layout(sheet_l, sheet_w, part_l, part_w, disp_kerf, margin)
    pcs = len(placements)
    total_area = sheet_l * sheet_w
    unit_area = part_area if part_area and part_area > 0 else part_l * part_w
    nested_area = min(total_area, pcs * unit_area)
    util = round(min(99.9, nested_area / total_area * 100), 1) if total_area > 0 else 0.0
    waste = round(max(0.0, 100.0 - util), 1)
    return {
        "pcs": pcs,
        "orientation": orientation,
        "util": util,
        "waste": waste,
        "nested_area": nested_area,
        "waste_area": max(0.0, total_area - nested_area),
        "total_area": total_area,
    }


def generate_nesting_diagram_base64(
    sheet_l: float, sheet_w: float, part_l: float, part_w: float,
    qty: int, part_svg_str: str, kerf: float = 2.0
) -> str:
    """
    Generates a high-quality SVG sheet layout, rasterizes it with PyMuPDF,
    and returns a base64 encoded PNG string.
    """
    if not HAS_FITZ or sheet_l <= 0 or sheet_w <= 0:
        return ""

    # SVG geometry inner elements
    part_inner = extract_inner_svg(part_svg_str)
    if not part_inner or part_l <= 0 or part_w <= 0:
        return ""

    disp_kerf = max(float(kerf), 0.5)
    margin = max(disp_kerf, min(sheet_l, sheet_w) * 0.01)
    placements, _orient = _build_nesting_layout(sheet_l, sheet_w, part_l, part_w, disp_kerf, margin)
    if not placements:
        return ""

    # Safety cap: limit placements to prevent oversized SVGs that crash PyMuPDF
    MAX_PLACEMENTS = 500
    if len(placements) > MAX_PLACEMENTS:
        placements = placements[:MAX_PLACEMENTS]

    uid = "part_geo"

    defs_parts = []
    # Hatch pattern
    defs_parts.append(
        f'<pattern id="hatch" patternUnits="userSpaceOnUse" width="36" height="36" patternTransform="rotate(45)">'
        f'<rect x="0" y="0" width="36" height="36" fill="#f8fafc"/>'
        f'<line x1="0" y1="0" x2="0" y2="36" stroke="#cbd5e1" stroke-width="0.8" opacity="0.55"/>'
        f'</pattern>'
    )

    view_box = "0 0 100 100"
    if 'viewBox="' in part_svg_str:
        vb_start = part_svg_str.find('viewBox="') + 9
        vb_end = part_svg_str.find('"', vb_start)
        view_box = part_svg_str[vb_start:vb_end]

    defs_parts.append(
        f'<symbol id="{uid}" viewBox="{view_box}" preserveAspectRatio="xMidYMid meet">'
        f'{part_inner}'
        f'</symbol>'
    )

    body_parts = []

    pad_left = max(58.0, sheet_l * 0.035)
    pad_top = max(44.0, sheet_w * 0.035)
    pad_right = max(16.0, sheet_l * 0.012)
    pad_bottom = max(18.0, sheet_w * 0.012)
    sheet_x = pad_left
    sheet_y = pad_top
    canvas_w = sheet_l + pad_left + pad_right
    canvas_h = sheet_w + pad_top + pad_bottom
    dim_y = sheet_y - max(20.0, pad_top * 0.45)
    dim_x = sheet_x - max(24.0, pad_left * 0.55)

    body_parts.append(f'<rect x="0" y="0" width="{canvas_w}" height="{canvas_h}" fill="#ffffff"/>')
    body_parts.append(f'<rect x="{sheet_x}" y="{sheet_y}" width="{sheet_l}" height="{sheet_w}" fill="#ffffff" stroke="#111111" stroke-width="2"/>')

    max_x = max(x + w for x, y, w, h, rot in placements)
    max_y = max(y + h for x, y, w, h, rot in placements)
    if sheet_l - max_x > 5:
        body_parts.append(f'<rect x="{sheet_x + max_x}" y="{sheet_y}" width="{sheet_l - max_x}" height="{sheet_w}" fill="#f1f5f9" opacity="1"/>')
    if sheet_w - max_y > 5:
        body_parts.append(f'<rect x="{sheet_x}" y="{sheet_y + max_y}" width="{min(max_x, sheet_l)}" height="{sheet_w - max_y}" fill="#f1f5f9" opacity="1"/>')

    safe_w = max(1.0, sheet_l - 2 * margin)
    safe_h = max(1.0, sheet_w - 2 * margin)
    body_parts.append(
        f'<rect x="{sheet_x + margin}" y="{sheet_y + margin}" width="{safe_w}" height="{safe_h}" '
        f'fill="none" stroke="#ef4444" stroke-width="1.3" stroke-dasharray="8,8"/>'
    )

    for x, y, w, h, rotated in placements:
        px = sheet_x + x
        py = sheet_y + y
        if rotated:
            body_parts.append(
                f'<g transform="translate({px + w:.3f} {py:.3f}) rotate(90)">'
                f'<use xlink:href="#{uid}" x="0" y="0" width="{h:.3f}" height="{w:.3f}" />'
                f'</g>'
            )
        else:
            body_parts.append(f'<use xlink:href="#{uid}" x="{px:.3f}" y="{py:.3f}" width="{w:.3f}" height="{h:.3f}" />')

    arrow = max(4.0, min(sheet_l, sheet_w) * 0.006)
    label_size = max(18.0, min(sheet_l, sheet_w) * 0.022)
    body_parts.append(f'<line x1="{sheet_x}" y1="{dim_y}" x2="{sheet_x + sheet_l}" y2="{dim_y}" stroke="#111111" stroke-width="1"/>')
    body_parts.append(f'<path d="M {sheet_x} {dim_y} l {arrow} {-arrow/2} l 0 {arrow} z" fill="#111111"/>')
    body_parts.append(f'<path d="M {sheet_x + sheet_l} {dim_y} l {-arrow} {-arrow/2} l 0 {arrow} z" fill="#111111"/>')
    body_parts.append(
        f'<text x="{sheet_x + sheet_l / 2}" y="{dim_y - 6}" text-anchor="middle" '
        f'font-family="Arial" font-size="{label_size}" fill="#111111">{sheet_l:.0f} mm</text>'
    )
    body_parts.append(f'<line x1="{dim_x}" y1="{sheet_y}" x2="{dim_x}" y2="{sheet_y + sheet_w}" stroke="#111111" stroke-width="1"/>')
    body_parts.append(f'<path d="M {dim_x} {sheet_y} l {-arrow/2} {arrow} l {arrow} 0 z" fill="#111111"/>')
    body_parts.append(f'<path d="M {dim_x} {sheet_y + sheet_w} l {-arrow/2} {-arrow} l {arrow} 0 z" fill="#111111"/>')
    body_parts.append(
        f'<text x="{dim_x - 10}" y="{sheet_y + sheet_w / 2}" text-anchor="middle" '
        f'font-family="Arial" font-size="{label_size}" fill="#111111" '
        f'transform="rotate(-90 {dim_x - 10} {sheet_y + sheet_w / 2})">{sheet_w:.0f} mm</text>'
    )

    defs_block = "\n".join(defs_parts)
    body_block = "\n".join(body_parts)

    svg_final = (
        f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
        f'width="{canvas_w}" height="{canvas_h}" viewBox="0 0 {canvas_w} {canvas_h}">\n'
        f'  <defs>\n{defs_block}\n</defs>\n'
        f'  {body_block}\n'
        f'</svg>'
    )

    return _rasterize_svg_base64(svg_final, target_width_px=1650)
