import os, math

try:
    import ezdxf; HAS_EZDXF = True
except ImportError:
    HAS_EZDXF = False

# 3D CAD support — PythonOCC (conda) or CadQuery/OCP (pip)
HAS_OCC = False
OCC_BACKEND = None
try:
    from OCP.STEPControl import STEPControl_Reader
    from OCP.IGESControl import IGESControl_Reader
    from OCP.BRep import BRep_Tool
    from OCP.BRepAdaptor import BRepAdaptor_Surface, BRepAdaptor_Curve
    from OCP.TopExp import TopExp_Explorer
    from OCP.TopAbs import TopAbs_FACE, TopAbs_EDGE, TopAbs_WIRE
    from OCP.GeomAbs import GeomAbs_Cylinder, GeomAbs_Plane
    from OCP.Bnd import Bnd_Box
    from OCP.IFSelect import IFSelect_RetDone
    from OCP.GProp import GProp_GProps
    # cadquery-ocp API compatibility shim.
    # Older builds exposed free functions `brepbndlib` / `brepgprop`;
    # 7.x exposes classes `BRepBndLib` / `BRepGProp` with `*_s` static methods.
    try:
        from OCP.BRepBndLib import brepbndlib  # old API
    except ImportError:
        from OCP.BRepBndLib import BRepBndLib as _BBL
        class brepbndlib:  # type: ignore
            Add = staticmethod(_BBL.Add_s)
    try:
        from OCP.BRepGProp import brepgprop  # old API
    except ImportError:
        from OCP.BRepGProp import BRepGProp as _BGP
        class brepgprop:  # type: ignore
            LinearProperties = staticmethod(_BGP.LinearProperties_s)
    HAS_OCC = True; OCC_BACKEND = "OCP"
except ImportError:
    try:
        from OCC.Core.STEPControl import STEPControl_Reader
        from OCC.Core.IGESControl import IGESControl_Reader
        from OCC.Core.BRep import BRep_Tool
        from OCC.Core.BRepAdaptor import BRepAdaptor_Surface, BRepAdaptor_Curve
        from OCC.Core.TopExp import TopExp_Explorer
        from OCC.Core.TopAbs import TopAbs_FACE, TopAbs_EDGE, TopAbs_WIRE
        from OCC.Core.GeomAbs import GeomAbs_Cylinder, GeomAbs_Plane
        from OCC.Core.Bnd import Bnd_Box
        from OCC.Core.BRepBndLib import brepbndlib
        from OCC.Core.IFSelect import IFSelect_RetDone
        from OCC.Core.GProp import GProp_GProps
        from OCC.Core.BRepGProp import brepgprop
        HAS_OCC = True; OCC_BACKEND = "PythonOCC"
    except ImportError:
        pass


# ═══════════════════════════════════════════════════════════════
#  §5  CAD READER (2D DXF + 3D STEP/IGES)
# ═══════════════════════════════════════════════════════════════

# ── 2D DXF: Advanced auto-detection ──

def _polyline_perimeter(pts, closed=False):
    """Perimeter of a point list."""
    total = 0
    n = len(pts)
    loop = n if closed else n - 1
    for i in range(loop):
        p1, p2 = pts[i], pts[(i + 1) % n]
        total += math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2)
    return total

def _polyline_area(pts):
    """Signed area (Shoelace formula) — positive = CCW."""
    n = len(pts)
    a = 0
    for i in range(n):
        x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % n]
        a += x1 * y2 - x2 * y1
    return a / 2.0

def _polyline_bbox(pts):
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)

def _detect_bends_in_polyline(pts, closed=False):
    """Detect sharp angle changes (potential bend lines) in a polyline.
    Returns list of (bend_index, angle_deg, bend_length)."""
    bends = []
    n = len(pts)
    loop = n if closed else n
    for i in range(1, loop - 1):
        p0 = pts[(i - 1) % n]; p1 = pts[i]; p2 = pts[(i + 1) % n]
        dx1, dy1 = p1[0] - p0[0], p1[1] - p0[1]
        dx2, dy2 = p2[0] - p1[0], p2[1] - p1[1]
        l1 = math.sqrt(dx1 * dx1 + dy1 * dy1)
        l2 = math.sqrt(dx2 * dx2 + dy2 * dy2)
        if l1 < 0.01 or l2 < 0.01:
            continue
        cos_a = (dx1 * dx2 + dy1 * dy2) / (l1 * l2)
        cos_a = max(-1, min(1, cos_a))
        angle = math.degrees(math.acos(cos_a))
        # A bend is a significant direction change (not 180° straight, not tiny jog)
        # Typical sheet metal bends: 85-95° (right angle bends) or 120-150° (shallow)
        if 30 < angle < 170:
            seg_len = min(l1, l2)  # bend segment length
            bends.append((i, round(angle, 1), round(seg_len, 2)))
    return bends

def _is_circle_like(pts, tol=0.15):
    """Check if a closed polyline approximates a circle. Returns (True, cx, cy, radius) or (False,...)."""
    if len(pts) < 6:
        return False, 0, 0, 0
    cx = sum(p[0] for p in pts) / len(pts)
    cy = sum(p[1] for p in pts) / len(pts)
    dists = [math.sqrt((p[0] - cx) ** 2 + (p[1] - cy) ** 2) for p in pts]
    avg_r = sum(dists) / len(dists)
    if avg_r < 0.5:
        return False, 0, 0, 0
    max_dev = max(abs(d - avg_r) for d in dists)
    if max_dev / avg_r < tol:
        return True, cx, cy, avg_r
    return False, 0, 0, 0

def read_dxf(fp):
    """Enhanced DXF reader — auto-detects ALL operations from geometry.
    Returns dict with: length, width, outer_perimeter, internal_cuts,
    holes, hole_dia, n_bends, bend_length, bend_angles, cut_total,
    entities_summary.
    """
    if not HAS_EZDXF:
        return None
    doc = ezdxf.readfile(fp)
    msp = doc.modelspace()

    # Collect all geometry
    all_xs, all_ys = [], []
    lines_data = []         # (start, end, length, layer)
    arcs_data = []          # (center, radius, start_angle, end_angle, arc_len, layer)
    circles_data = []       # (center, radius, diameter, layer)
    polylines_data = []     # (pts, closed, perimeter, area, layer)
    bend_lines = []         # lines on BEND/FOLD layers

    # ── Collect LINEs ──
    for e in msp.query("LINE"):
        s, en = e.dxf.start, e.dxf.end
        ll = math.sqrt((en.x - s.x) ** 2 + (en.y - s.y) ** 2)
        layer = e.dxf.layer.upper() if hasattr(e.dxf, 'layer') else ""
        all_xs += [s.x, en.x]; all_ys += [s.y, en.y]
        lines_data.append(((s.x, s.y), (en.x, en.y), ll, layer))
        # Detect bend/fold annotation lines
        if any(kw in layer for kw in ("BEND", "FOLD", "SCORE", "CREASE")):
            bend_lines.append(((s.x, s.y), (en.x, en.y), ll))

    # ── Collect ARCs ──
    for e in msp.query("ARC"):
        c = e.dxf.center
        sa, ea = e.dxf.start_angle, e.dxf.end_angle
        sweep = ea - sa
        if sweep < 0: sweep += 360
        arc_len = math.radians(min(abs(sweep), 360)) * e.dxf.radius
        layer = e.dxf.layer.upper() if hasattr(e.dxf, 'layer') else ""
        all_xs.append(c.x); all_ys.append(c.y)
        arcs_data.append(((c.x, c.y), e.dxf.radius, sa, ea, arc_len, layer))

    # ── Collect CIRCLEs ──
    for e in msp.query("CIRCLE"):
        c = e.dxf.center
        layer = e.dxf.layer.upper() if hasattr(e.dxf, 'layer') else ""
        all_xs.append(c.x); all_ys.append(c.y)
        circles_data.append(((c.x, c.y), e.dxf.radius, e.dxf.radius * 2, layer))

    # ── Collect LWPOLYLINEs ──
    for e in msp.query("LWPOLYLINE"):
        pts = list(e.get_points(format="xy"))
        if not pts: continue
        closed = e.closed
        perim = _polyline_perimeter(pts, closed)
        area = abs(_polyline_area(pts)) if closed else 0
        layer = e.dxf.layer.upper() if hasattr(e.dxf, 'layer') else ""
        for p in pts:
            all_xs.append(p[0]); all_ys.append(p[1])
        polylines_data.append((pts, closed, perim, area, layer))

    # ── Also check POLYLINE (2D) ──
    for e in msp.query("POLYLINE"):
        try:
            pts = [(v.dxf.location.x, v.dxf.location.y) for v in e.vertices]
            if not pts: continue
            closed = e.is_closed
            perim = _polyline_perimeter(pts, closed)
            area = abs(_polyline_area(pts)) if closed else 0
            layer = e.dxf.layer.upper() if hasattr(e.dxf, 'layer') else ""
            for p in pts:
                all_xs.append(p[0]); all_ys.append(p[1])
            polylines_data.append((pts, closed, perim, area, layer))
        except:
            pass

    # ── Collect layer names (distinct) and any text annotations so higher
    # layers can scan them for process keywords (WELDING, BEND, LOUVER…).
    # Keep POSITIONED chunks too so fab_grouper can spatially cluster them
    # into per-drawing regions when a DXF has multiple title blocks.
    layer_names = set()
    for e in msp:
        try:
            lname = getattr(e.dxf, "layer", None)
            if lname: layer_names.add(str(lname).upper())
        except Exception:
            continue
    annotations_bits = []
    mtext_chunks = []       # (x, y, text) for each MTEXT/TEXT
    for e in msp.query("TEXT"):
        try:
            t = (e.dxf.text or "").strip()
            if not t: continue
            annotations_bits.append(t)
            try:
                ins = e.dxf.insert
                mtext_chunks.append((float(ins.x), float(ins.y), t))
            except Exception:
                pass
        except Exception:
            continue
    for e in msp.query("MTEXT"):
        try:
            t = (e.text or "").strip()
            if not t: continue
            annotations_bits.append(t)
            try:
                ins = e.dxf.insert
                mtext_chunks.append((float(ins.x), float(ins.y), t))
            except Exception:
                pass
        except Exception:
            continue

    # ── Block ATTRIB entities. AutoCAD title-block templates store the
    # drawing's metadata (DRAWING_NUMBER, REVISION, DESCRIPTION, SCALE,
    # etc.) as ATTRIB children of INSERT entities. These are by far the
    # most reliable source of title-block fields when present.
    block_attrs = {}        # normalized_tag → value (first non-empty wins)
    block_attrs_positioned = []   # list of (x, y, tag, value, block_name)
    for ins_ent in msp.query("INSERT"):
        try:
            block_name = str(ins_ent.dxf.name) if hasattr(ins_ent.dxf, "name") else ""
            ix = float(ins_ent.dxf.insert.x); iy = float(ins_ent.dxf.insert.y)
            for attr in ins_ent.attribs:
                try:
                    tag = str(attr.dxf.tag or "").strip().upper()
                    val = str(attr.dxf.text or "").strip()
                    if not tag or not val:
                        continue
                    if tag not in block_attrs:
                        block_attrs[tag] = val
                    block_attrs_positioned.append((ix, iy, tag, val, block_name))
                except Exception:
                    continue
        except Exception:
            continue

    # ── DIMENSION entities: the on-drawing measurement callouts.
    # Stored both globally (list of values) and positioned (for per-region
    # L/W fallback in multi-drawing DXFs).
    dim_measurements = []
    dim_positioned = []     # (x, y, measurement)
    for e in msp.query("DIMENSION"):
        try:
            m = getattr(e.dxf, "actual_measurement", None)
            if m is None: continue
            v = float(m)
            if not (5 <= v <= 5000): continue
            dim_measurements.append(round(v, 1))
            try:
                # DIMENSION entities expose several position attrs; defpoint
                # is most consistent. Fall back to text_midpoint or 0,0.
                dp = getattr(e.dxf, "defpoint", None) \
                     or getattr(e.dxf, "text_midpoint", None)
                if dp is not None:
                    dim_positioned.append((float(dp.x), float(dp.y), round(v, 1)))
            except Exception:
                pass
        except Exception:
            continue

    # ════════════════════════════════════════════
    #  CLASSIFY GEOMETRY
    # ════════════════════════════════════════════

    try:
        units = doc.header.get('$INSUNITS', 4)
        scale = 25.4 if units == 1 else 1.0
    except Exception:
        scale = 1.0

    # Overall bounding box
    from ezdxf import bbox
    extents = bbox.extents(msp)
    
    length_mm = 0.0
    width_mm = 0.0
    
    if extents.has_data:
        length_mm = abs(extents.size.x) * scale
        width_mm = abs(extents.size.y) * scale
    elif all_xs:
        # Raw collected points fallback — scale already factored in once
        length_mm = (max(all_xs) - min(all_xs)) * scale
        width_mm = (max(all_ys) - min(all_ys)) * scale
    else:
        for block in doc.blocks:
            if not block.name.startswith('*'):
                b_extents = bbox.extents(block)
                if b_extents.has_data:
                    length_mm = abs(b_extents.size.x) * scale
                    width_mm = abs(b_extents.size.y) * scale
                    break

    bb_l = max(length_mm, width_mm)
    bb_w = min(length_mm, width_mm)
    
    if bb_l == 0.0:
        return None

    # ── Separate outer profile vs internal cutouts ──
    # Largest closed polyline by area = outer profile
    closed_polys = [(pts, perim, area, layer) for pts, closed, perim, area, layer
                    in polylines_data if closed and area > 1]

    # Check if any closed polylines are actually holes (circle-like)
    poly_holes = []
    real_closed_polys = []
    for pts, perim, area, layer in closed_polys:
        is_circ, cx, cy, r = _is_circle_like(pts)
        if is_circ and r * 2 < min(bb_l, bb_w) * 0.5:
            poly_holes.append((cx, cy, r * 2))
        else:
            real_closed_polys.append((pts, perim, area, layer))

    outer_perimeter = 0
    internal_cut_perim = 0
    detected_bends = []

    if real_closed_polys:
        # Sort by area descending — largest = outer profile
        real_closed_polys.sort(key=lambda x: x[2], reverse=True)
        outer_pts, outer_perim, outer_area, outer_layer = real_closed_polys[0]
        outer_perimeter = outer_perim

        # Detect bends from outer polyline angle changes
        detected_bends += _detect_bends_in_polyline(outer_pts, closed=True)

        # All other closed polys = internal cutouts
        for pts, perim, area, layer in real_closed_polys[1:]:
            # Check if it's a bend annotation or actual cutout
            if any(kw in layer for kw in ("BEND", "FOLD", "SCORE")):
                bends_in = _detect_bends_in_polyline(pts, closed=True)
                detected_bends += bends_in
            else:
                internal_cut_perim += perim
    else:
        # No closed polylines — sum all line/arc lengths as total cut
        outer_perimeter = sum(l[2] for l in lines_data) + sum(a[4] for a in arcs_data)
        for pts, closed, perim, area, layer in polylines_data:
            outer_perimeter += perim

    # ── Holes: circles + circle-like polylines ──
    all_holes = []
    for c, r, dia, layer in circles_data:
        # Small circles relative to part = holes; very large = outer profile
        if dia < min(bb_l, bb_w) * 0.8:
            all_holes.append(dia)
        else:
            outer_perimeter += 2 * math.pi * r  # large circle = outer cut
    for cx, cy, dia in poly_holes:
        all_holes.append(dia)

    hole_cut = sum(math.pi * d for d in all_holes)  # perimeter of all holes
    n_holes = len(all_holes)
    avg_hole_dia = round(sum(all_holes) / n_holes, 2) if n_holes > 0 else 0

    # ── Bends from annotated layers ──
    for start, end, ll in bend_lines:
        detected_bends.append((-1, 90.0, ll))  # assume 90° for layer-marked bends

    # Also detect bends from open polylines
    for pts, closed, perim, area, layer in polylines_data:
        if not closed and len(pts) >= 3:
            bends_in = _detect_bends_in_polyline(pts, closed=False)
            detected_bends += bends_in

    n_bends = len(detected_bends)
    avg_bend_len = round(sum(b[2] for b in detected_bends) / n_bends, 2) if n_bends > 0 else 0
    bend_angles = [b[1] for b in detected_bends]

    # ── Total cut path ──
    total_cut = outer_perimeter + internal_cut_perim + hole_cut

    # ── Apply Scale (inches -> mm) for geometry measurements ──
    # NOTE: bb_l / bb_w are already scaled when read from ezdxf extents above.
    # Only the polyline/circle/arc lengths (which were computed in DXF units)
    # need to be multiplied here.
    if scale != 1.0:
        outer_perimeter *= scale
        internal_cut_perim *= scale
        hole_cut *= scale
        total_cut *= scale
        avg_hole_dia *= scale
        avg_bend_len *= scale
        for i in range(len(all_holes)):
            all_holes[i] *= scale

    # ── Weld detection: lines on WELD layer ──
    weld_len = 0
    for start, end, ll, layer in lines_data:
        if "WELD" in layer:
            weld_len += ll

    # ── Summary ──
    summary = []
    summary.append(f"Bounding box: {bb_l} × {bb_w} mm")
    summary.append(f"Outer perimeter: {round(outer_perimeter, 1)} mm")
    if internal_cut_perim > 0:
        summary.append(f"Internal cutouts: {round(internal_cut_perim, 1)} mm")
    if n_holes > 0:
        summary.append(f"Holes: {n_holes} (avg Ø{avg_hole_dia} mm)")
    if n_bends > 0:
        summary.append(f"Bends: {n_bends} (avg length {avg_bend_len} mm, angles: {bend_angles})")
    if weld_len > 0:
        summary.append(f"Weld lines: {round(weld_len, 1)} mm")
    summary.append(f"Total entities: {len(lines_data)}L + {len(arcs_data)}A + "
                   f"{len(circles_data)}C + {len(polylines_data)}P")

    return {
        "source": "DXF",
        "length": round(bb_l, 2),
        "width": round(bb_w, 2),
        "outer_perimeter": round(outer_perimeter, 2),
        "internal_cuts": round(internal_cut_perim, 2),
        "hole_cut": round(hole_cut, 2),
        "cut": total_cut,
        "holes": n_holes,
        "hole_dia": avg_hole_dia,
        "n_bends": n_bends,
        "bend_length": avg_bend_len,
        "bend_angles": bend_angles,
        "weld_length": round(weld_len, 2),
        "summary": " | ".join(summary),
        # Raw process-hint sources for fab_grouper's keyword matcher.
        "layers": sorted(layer_names),
        "annotations": " | ".join(annotations_bits),
        # On-drawing dimension callouts — used as a L/W fallback when
        # neither the title-block text nor the bbox is reliable.
        "dim_measurements": sorted(set(dim_measurements), reverse=True),
        # Positioned chunks for per-drawing (spatial) clustering.
        "mtext_chunks": mtext_chunks,
        "dim_positioned": dim_positioned,
        # AutoCAD title-block ATTRIB entities — most reliable source for
        # drawing number / revision / description / paper size.
        "block_attrs": block_attrs,
        "block_attrs_positioned": block_attrs_positioned,
        # Best-effort drawing number lifted from title-block ATTRIBs or MTEXT.
        # Used by the Excel-BOM matcher in tab_new_quote to auto-fill quantity.
        "drg_no": _extract_drg_no_from_dxf(block_attrs, mtext_chunks),
        # All LINE entities — used to detect "cancelled drawing" X marks
        # (two long diagonal lines crossing a drawing region).
        "all_lines": [((s[0], s[1]), (e[0], e[1]), ll)
                      for s, e, ll, _lyr in lines_data
                      if ll >= 100],
    }


def _extract_drg_no_from_dxf(block_attrs: dict, mtext_chunks: list) -> str:
    """Pull a drawing number out of a DXF.

    Priority:
      1. Title-block ATTRIB tags that name the field directly
         (DRAWING_NUMBER, DRG_NO, DWG_NO, NUMBER, …).
      2. fab_grouper's text scanner over MTEXT chunks (handles inline
         'DRG. NO.: <value>' and label-then-value patterns).
    """
    if block_attrs:
        for tag in ("DRAWING_NUMBER", "DRAWINGNUMBER", "DRG_NO", "DRG_NUMBER",
                    "DWG_NO", "DWG_NUMBER", "DOC_NUMBER", "NUMBER"):
            v = block_attrs.get(tag)
            if v and len(str(v).strip()) >= 3:
                return str(v).strip()
    try:
        from core.fab_grouper import _extract_drg_no
        return _extract_drg_no(mtext_chunks) or ""
    except Exception:
        return ""


# ── 3D CAD: STEP / IGES reader ──

def read_step_iges(fp):
    """Read STEP or IGES file using PythonOCC/OCP.
    Extracts dimensions, holes, bends, edges for operations auto-fill.
    Returns dict similar to read_dxf().
    """
    if not HAS_OCC:
        return None

    ext = os.path.splitext(fp)[1].lower()

    if ext in ('.step', '.stp'):
        reader = STEPControl_Reader()
        status = reader.ReadFile(fp)
        if status != IFSelect_RetDone:
            return None
        reader.TransferRoots()
        shape = reader.OneShape()
    elif ext in ('.iges', '.igs'):
        reader = IGESControl_Reader()
        status = reader.ReadFile(fp)
        if status != IFSelect_RetDone:
            return None
        reader.TransferRoots()
        shape = reader.OneShape()
    else:
        return None

    # ── Bounding box → dimensions ──
    bbox = Bnd_Box()
    brepbndlib.Add(shape, bbox)
    xmin, ymin, zmin, xmax, ymax, zmax = bbox.Get()
    dims = sorted([round(xmax - xmin, 2), round(ymax - ymin, 2), round(zmax - zmin, 2)], reverse=True)

    # dims[0] = length, dims[1] = width, dims[2] = height/thickness
    length = dims[0]
    width = dims[1]
    thickness_3d = dims[2]  # smallest dimension = likely sheet thickness

    # ── Analyze faces ──
    n_holes = 0
    hole_diameters = []
    planar_faces = []
    cylindrical_faces = []

    explorer = TopExp_Explorer(shape, TopAbs_FACE)
    while explorer.More():
        face = explorer.Current()
        try:
            surf = BRepAdaptor_Surface(face)
            stype = surf.GetType()

            if stype == GeomAbs_Cylinder:
                cyl = surf.Cylinder()
                radius = cyl.Radius()
                dia = round(radius * 2, 2)
                # Cylindrical faces with small radius relative to part = holes
                if dia < min(length, width) * 0.5:
                    # Each hole has 1 cylindrical face
                    hole_diameters.append(dia)
                    n_holes += 1
                cylindrical_faces.append((dia, radius))

            elif stype == GeomAbs_Plane:
                pln = surf.Plane()
                normal = pln.Axis().Direction()
                nx, ny, nz = normal.X(), normal.Y(), normal.Z()
                planar_faces.append((nx, ny, nz))

        except:
            pass
        explorer.Next()

    # ── Detect bends from planar face angles ──
    # Two adjacent planar faces at an angle = one bend
    n_bends = 0
    bend_angles_3d = []
    seen_pairs = set()

    for i in range(len(planar_faces)):
        for j in range(i + 1, len(planar_faces)):
            n1 = planar_faces[i]
            n2 = planar_faces[j]
            # Dot product of normals
            dot = n1[0] * n2[0] + n1[1] * n2[1] + n1[2] * n2[2]
            dot = max(-1, min(1, dot))
            angle = math.degrees(math.acos(abs(dot)))
            # Faces at significant angle (not parallel, not same face)
            if 10 < angle < 170:
                pair_key = (round(angle, 0),)
                if pair_key not in seen_pairs:
                    seen_pairs.add(pair_key)
                    n_bends += 1
                    bend_angles_3d.append(round(angle, 1))

    # Heuristic: for sheet metal, bends = pairs of angled planar faces / 2
    # (each bend creates 2 face-pair relationships)
    if n_bends > 4:
        n_bends = max(1, n_bends // 2)
        bend_angles_3d = bend_angles_3d[:n_bends]

    avg_hole_dia = round(sum(hole_diameters) / n_holes, 2) if n_holes > 0 else 0

    # ── Edge length (total cut perimeter estimate) ──
    total_edge_len = 0
    edge_explorer = TopExp_Explorer(shape, TopAbs_EDGE)
    edge_count = 0
    while edge_explorer.More():
        edge = edge_explorer.Current()
        try:
            props = GProp_GProps()
            brepgprop.LinearProperties(edge, props)
            total_edge_len += props.Mass()
            edge_count += 1
        except:
            pass
        edge_explorer.Next()

    # Outer perimeter estimate: total edges minus hole perimeters
    hole_perim = sum(math.pi * d for d in hole_diameters)
    outer_perim = max(0, total_edge_len - hole_perim)
    # For sheet metal, the perimeter is roughly 2*(L+W) for a flat part
    # Use the actual edge data but cap at something reasonable
    est_outer = 2 * (length + width)
    if outer_perim > est_outer * 5:
        outer_perim = est_outer  # fallback if edge count is crazy

    # Bend length estimate: for sheet metal, bends span the shorter dimension
    avg_bend_len = round(min(length, width), 2) if n_bends > 0 else 0

    summary = []
    summary.append(f"3D bbox: {length} × {width} × {thickness_3d} mm")
    summary.append(f"Faces: {len(planar_faces)} planar, {len(cylindrical_faces)} cylindrical")
    if n_holes > 0:
        summary.append(f"Holes: {n_holes} (avg Ø{avg_hole_dia})")
    if n_bends > 0:
        summary.append(f"Bends: {n_bends} (angles: {bend_angles_3d})")
    summary.append(f"Edges: {edge_count}, total length: {round(total_edge_len, 1)} mm")

    return {
        "source": "3D-CAD",
        "length": length,
        "width": width,
        "thickness_3d": thickness_3d,
        "outer_perimeter": round(outer_perim, 2),
        "internal_cuts": 0,
        "hole_cut": round(hole_perim, 2),
        "cut": round(outer_perim + hole_perim, 2),
        "holes": n_holes,
        "hole_dia": avg_hole_dia,
        "n_bends": n_bends,
        "bend_length": avg_bend_len,
        "bend_angles": bend_angles_3d,
        "weld_length": 0,
        "summary": " | ".join(summary),
    }


# ── Unified CAD reader ──

def read_cad(fp):
    """Read any supported CAD file — routes to DXF or STEP/IGES reader."""
    ext = os.path.splitext(fp)[1].lower()
    if ext == ".dxf":
        return read_dxf(fp)
    elif ext in (".step", ".stp", ".iges", ".igs"):
        return read_step_iges(fp)
    return None


# ── 2D DXF renderer (unchanged but enhanced labels) ──

def render_dxf_2d(fp):
    """Render DXF as 2D matplotlib figure (actual part drawing)."""
    if not HAS_EZDXF: return
    try:
        import matplotlib.pyplot as plt
        from matplotlib.patches import Arc as MArc, Circle as MCircle
    except ImportError: return

    doc = ezdxf.readfile(fp); msp = doc.modelspace()
    fig, ax = plt.subplots(1, 1, figsize=(10, 7))
    ax.set_aspect('equal')

    for e in msp.query("LINE"):
        s,en = e.dxf.start, e.dxf.end
        layer = e.dxf.layer.upper() if hasattr(e.dxf, 'layer') else ""
        color = '#e74c3c' if "BEND" in layer or "FOLD" in layer else '#1a4f7a'
        ls = '--' if "BEND" in layer or "FOLD" in layer else '-'
        ax.plot([s.x, en.x], [s.y, en.y], color=color, linewidth=1.2, linestyle=ls)

    for e in msp.query("ARC"):
        c = e.dxf.center
        arc = MArc((c.x, c.y), e.dxf.radius*2, e.dxf.radius*2,
                   angle=0, theta1=e.dxf.start_angle, theta2=e.dxf.end_angle,
                   color='#1a4f7a', linewidth=1.2)
        ax.add_patch(arc)

    for e in msp.query("CIRCLE"):
        c = e.dxf.center
        circ = MCircle((c.x, c.y), e.dxf.radius, fill=False,
                       color='#c0392b', linewidth=1.0, linestyle='--')
        ax.add_patch(circ)
        ax.annotate(f"Ø{e.dxf.radius*2:.1f}", (c.x, c.y), fontsize=7,
                    color='#c0392b', ha='center', va='bottom')

    for e in msp.query("LWPOLYLINE"):
        pts = list(e.get_points(format="xy"))
        if e.closed: pts.append(pts[0])
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        ax.plot(xs, ys, color='#04b3b6', linewidth=1.2)

    ax.grid(True, alpha=0.15)
    ax.set_title(f"DXF: {os.path.basename(fp)}", fontsize=12, fontweight='bold', color='#143b62')
    ax.set_xlabel("mm"); ax.set_ylabel("mm")
    plt.tight_layout(); plt.show()


# ── 3D STEP/IGES renderer ──

def render_3d_cad(fp):
    """Render 3D CAD file as a matplotlib wireframe (fallback viewer)."""
    if not HAS_OCC:
        return
    try:
        import matplotlib.pyplot as plt
        from mpl_toolkits.mplot3d import Axes3D
        from mpl_toolkits.mplot3d.art3d import Poly3DCollection
    except ImportError:
        return

    ext = os.path.splitext(fp)[1].lower()
    if ext in ('.step', '.stp'):
        reader = STEPControl_Reader()
        status = reader.ReadFile(fp)
        if status != IFSelect_RetDone: return
        reader.TransferRoots(); shape = reader.OneShape()
    elif ext in ('.iges', '.igs'):
        reader = IGESControl_Reader()
        status = reader.ReadFile(fp)
        if status != IFSelect_RetDone: return
        reader.TransferRoots(); shape = reader.OneShape()
    else:
        return

    # Collect edge points for wireframe
    edge_lines = []
    edge_explorer = TopExp_Explorer(shape, TopAbs_EDGE)
    while edge_explorer.More():
        edge = edge_explorer.Current()
        try:
            curve = BRepAdaptor_Curve(edge)
            u0, u1 = curve.FirstParameter(), curve.LastParameter()
            pts = []
            for i in range(21):
                u = u0 + (u1 - u0) * i / 20
                pnt = curve.Value(u)
                pts.append((pnt.X(), pnt.Y(), pnt.Z()))
            edge_lines.append(pts)
        except:
            pass
        edge_explorer.Next()

    if not edge_lines:
        return

    fig = plt.figure(figsize=(10, 7))
    ax = fig.add_subplot(111, projection='3d')

    for pts in edge_lines:
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        zs = [p[2] for p in pts]
        ax.plot(xs, ys, zs, color='#1a4f7a', linewidth=0.8)

    ax.set_xlabel("X (mm)"); ax.set_ylabel("Y (mm)"); ax.set_zlabel("Z (mm)")
    ax.set_title(f"3D: {os.path.basename(fp)}", fontsize=12, fontweight='bold', color='#143b62')
    plt.tight_layout(); plt.show()


def show_nesting_visual(n, q=None):
    """Nesting layout with vibrant kerf lines, waste zones, and profit info.
    Pass q (Quote) to show profit/cost breakdown.
    """
    try:
        import matplotlib.pyplot as plt
        import matplotlib.patches as patches
        from matplotlib.lines import Line2D
    except ImportError: return

    fig, ax = plt.subplots(1, 1, figsize=(12, 7.5))
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#f0f2f5')

    # Exaggerate kerf for visibility — min 8% of smallest part dim
    real_kerf = n.kerf
    min_dim = min(n.pl, n.pw)
    vis_kerf = max(real_kerf, min_dim * 0.08)

    # Sheet background
    ax.add_patch(patches.Rectangle((0, 0), n.sl, n.sw, lw=3,
        edgecolor='#2b211a', facecolor='#f3eee5', zorder=0))

    if n.orient == "Rotated 90°":
        pl, pw = n.pw, n.pl
    else:
        pl, pw = n.pl, n.pw

    el, ew = pl + vis_kerf, pw + vis_kerf
    cols, rows = int(n.sl // el), int(n.sw // ew)

    clrs = ['#00b4d8', '#0077b6', '#00cfb4', '#023e8a']
    cnt = 0
    for rr in range(rows):
        for cc in range(cols):
            x, y = cc * el, rr * ew

            # ── KERF LINES — bright red-orange, very visible ──
            if cc > 0:
                ax.add_patch(patches.Rectangle((x - vis_kerf / 4, y),
                    vis_kerf / 2, pw + vis_kerf,
                    lw=0, facecolor='#ff3b30', alpha=0.85, zorder=2))
            if rr > 0:
                ax.add_patch(patches.Rectangle((x, y - vis_kerf / 4),
                    pl + vis_kerf, vis_kerf / 2,
                    lw=0, facecolor='#ff3b30', alpha=0.85, zorder=2))

            # ── PART rectangle ──
            ax.add_patch(patches.Rectangle(
                (x + vis_kerf / 2, y + vis_kerf / 2), pl, pw,
                lw=0.8, edgecolor='#ffffff', facecolor=clrs[cnt % 4],
                alpha=0.85, zorder=3))
            ax.text(x + vis_kerf / 2 + pl / 2, y + vis_kerf / 2 + pw / 2,
                    f"{cnt + 1}", ha='center', va='center',
                    fontsize=max(5, min(9, int(min_dim / 35))),
                    color='white', fontweight='bold', zorder=4)
            cnt += 1

    # ── Waste areas — bright hatched ──
    used_w = cols * el
    used_h = rows * ew
    if used_w < n.sl:
        ax.add_patch(patches.Rectangle((used_w, 0), n.sl - used_w, n.sw,
            lw=0, facecolor='#ffe0de', alpha=0.85, hatch='xxx',
            edgecolor='#ff3b30', zorder=1))
        ax.text(used_w + (n.sl - used_w) / 2, n.sw / 2, "WASTE",
                ha='center', va='center', fontsize=10, color='#d32f2f',
                fontweight='bold', rotation=90, alpha=0.9, zorder=5)
    if used_h < n.sw:
        ax.add_patch(patches.Rectangle((0, used_h), min(used_w, n.sl), n.sw - used_h,
            lw=0, facecolor='#ffe0de', alpha=0.85, hatch='xxx',
            edgecolor='#ff3b30', zorder=1))
        ax.text(min(used_w, n.sl) / 2, used_h + (n.sw - used_h) / 2, "WASTE",
                ha='center', va='center', fontsize=10, color='#d32f2f',
                fontweight='bold', alpha=0.9, zorder=5)

    # ── Legend ──
    legend_items = [
        Line2D([0], [0], marker='s', color='w', markerfacecolor='#00b4d8',
               markersize=14, label=f'Part ({n.pl} × {n.pw} mm)'),
        Line2D([0], [0], marker='s', color='w', markerfacecolor='#ff3b30',
               markersize=14, label=f'Kerf cut line ({real_kerf} mm)'),
        Line2D([0], [0], marker='s', color='w', markerfacecolor='#ffe0de',
               markersize=14, label=f'Waste area ({n.waste}%)'),
        Line2D([0], [0], marker='s', color='w', markerfacecolor='#f3eee5',
               markersize=14, label=f'Sheet ({n.sl} × {n.sw} mm)'),
    ]
    leg = ax.legend(handles=legend_items, loc='upper right', fontsize=9,
                    framealpha=0.95, edgecolor='#bbb', fancybox=True,
                    shadow=True)
    leg.get_frame().set_facecolor('#ffffff')

    # ── Info bar below chart ──
    line1 = (f"Parts/sheet: {cnt}   |   Layout: {n.orient}   |   "
             f"Utilization: {n.util}%   |   Waste: {n.waste}%   |   "
             f"Sheets needed: {n.sheets}")
    ax.text(n.sl / 2, -n.sw * 0.045, line1, ha='center', va='top',
            fontsize=9, color='#2b211a', fontweight='bold',
            bbox=dict(boxstyle='round,pad=0.4', facecolor='#edf0f4',
                      edgecolor='#c0c8d4', alpha=0.9))

    # ── Profit & cost info (if Quote available) ──
    if q:
        sheet_cost = q.sheet_cost
        total_mat = sheet_cost * n.sheets if sheet_cost else 0
        revenue = q.total
        cost_per_pc = q.sub + q.overhead  # cost without profit
        total_cost = cost_per_pc * q.qty
        total_profit = revenue - total_cost
        profit_pct = round(total_profit / revenue * 100, 1) if revenue > 0 else 0

        line2 = (f"Sheet cost: ₹{sheet_cost:,.0f} × {n.sheets} = ₹{total_mat:,.0f}   |   "
                 f"Revenue: ₹{revenue:,.0f}   |   "
                 f"Profit: ₹{total_profit:,.0f}  ({profit_pct}%)")
        ax.text(n.sl / 2, -n.sw * 0.09, line2, ha='center', va='top',
                fontsize=9, color='#0077b6', fontweight='bold',
                bbox=dict(boxstyle='round,pad=0.4', facecolor='#e6f7ff',
                          edgecolor='#90cdf4', alpha=0.9))

    ax.set_xlim(-30, n.sl + 60)
    ylim_bot = -n.sw * 0.14 if q else -n.sw * 0.08
    ax.set_ylim(ylim_bot, n.sw + 40)
    ax.set_aspect('equal')
    ax.set_xlabel(f'Length ({n.sl} mm)', fontsize=10, color='#2b211a')
    ax.set_ylabel(f'Width ({n.sw} mm)', fontsize=10, color='#2b211a')
    ax.set_title(f'Nesting Layout:  {cnt} pcs/sheet   |   {n.name}   |   Utilization: {n.util}%',
                 fontsize=13, fontweight='bold', color='#2b211a', pad=14)
    ax.tick_params(colors='#4a5568')
    ax.grid(False)
    plt.tight_layout()
    plt.show()
