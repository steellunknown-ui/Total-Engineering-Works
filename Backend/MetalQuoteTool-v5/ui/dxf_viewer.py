"""Embedded DXF viewer — pops up a window with a matplotlib canvas
showing one drawing region.

Reused by the FAB Sheet's "View" column: clicking a row opens this viewer
zoomed to that variant's `cluster_bbox` so multi-drawing DXFs can be
inspected one drawing at a time.
"""
from __future__ import annotations
import os
import tkinter as tk
from tkinter import messagebox

try:
    import ezdxf
    HAS_EZDXF = True
except Exception:
    HAS_EZDXF = False


def _layer_color(layer_name: str) -> tuple[str, str]:
    """Return (color, linestyle) for a DXF layer name.
    Matches the convention in core/cad_reader.render_dxf_2d so the
    embedded viewer looks like the standalone one."""
    n = (layer_name or "").upper()
    if "BEND" in n or "FOLD" in n:
        return ("#e74c3c", "--")    # bend lines = red dashed
    if "HIDDEN" in n or "DASH" in n:
        return ("#a8a094", ":")
    if "DIM" in n:
        return ("#64748b", "-")
    if "TEXT" in n or "TITLE" in n:
        return ("#6e655a", "-")
    if "WELD" in n:
        return ("#a855f7", "-")     # weld = purple
    return ("#1a4f7a", "-")          # default = navy solid


def open_dxf_viewer(parent, dxf_path: str, bbox: tuple | None = None,
                     title: str = "") -> None:
    """Open a top-level window rendering the DXF in a Tk canvas.
    `bbox` (x0, y0, x1, y1) crops the view to one drawing region.
    """
    if not dxf_path or not os.path.exists(dxf_path):
        messagebox.showinfo("View", f"DXF not found:\n{dxf_path}")
        return
    if not HAS_EZDXF:
        messagebox.showerror("View",
            "ezdxf is not installed — can't render DXF previews.")
        return
    try:
        import matplotlib
        matplotlib.use("TkAgg")
        import matplotlib.pyplot as plt
        from matplotlib.backends.backend_tkagg import (
            FigureCanvasTkAgg, NavigationToolbar2Tk)
        from matplotlib.patches import Arc as MArc, Circle as MCircle
    except ImportError:
        messagebox.showerror("View",
            "matplotlib is not installed — `pip install matplotlib`.")
        return

    try:
        doc = ezdxf.readfile(dxf_path)
    except Exception as e:
        messagebox.showerror("View", f"Couldn't read DXF:\n{e}")
        return
    msp = doc.modelspace()

    # ── Build figure ──
    win = tk.Toplevel(parent)
    win.title(title or f"DXF Viewer — {os.path.basename(dxf_path)}")
    win.geometry("1100x780")

    fig, ax = plt.subplots(figsize=(11, 7.5))
    ax.set_aspect("equal")
    ax.grid(True, alpha=0.15)

    # Optional bbox crop. We pad ~10% so leader lines and dim arrows
    # outside the MTEXT cluster aren't clipped.
    crop = None
    if bbox and len(bbox) == 4:
        x0, y0, x1, y1 = bbox
        if x1 > x0 and y1 > y0:
            pad_x = max(50.0, (x1 - x0) * 0.10)
            pad_y = max(50.0, (y1 - y0) * 0.10)
            crop = (x0 - pad_x, y0 - pad_y, x1 + pad_x, y1 + pad_y)

    def _in_crop(x: float, y: float) -> bool:
        if crop is None:
            return True
        return crop[0] <= x <= crop[2] and crop[1] <= y <= crop[3]

    def _seg_in_crop(sx, sy, ex, ey) -> bool:
        # Cheap test: include if EITHER endpoint or the midpoint is in crop.
        if crop is None:
            return True
        return (_in_crop(sx, sy) or _in_crop(ex, ey)
                or _in_crop((sx + ex) / 2, (sy + ey) / 2))

    n_lines = n_arcs = n_circles = n_polys = n_text = 0
    for e in msp.query("LINE"):
        s, en = e.dxf.start, e.dxf.end
        if not _seg_in_crop(s.x, s.y, en.x, en.y):
            continue
        color, ls = _layer_color(getattr(e.dxf, "layer", ""))
        ax.plot([s.x, en.x], [s.y, en.y],
                color=color, linewidth=1.2, linestyle=ls)
        n_lines += 1

    for e in msp.query("ARC"):
        c = e.dxf.center
        if not _in_crop(c.x, c.y):
            continue
        arc = MArc((c.x, c.y), e.dxf.radius * 2, e.dxf.radius * 2,
                   angle=0, theta1=e.dxf.start_angle,
                   theta2=e.dxf.end_angle,
                   color="#1a4f7a", linewidth=1.2)
        ax.add_patch(arc); n_arcs += 1

    for e in msp.query("CIRCLE"):
        c = e.dxf.center
        if not _in_crop(c.x, c.y):
            continue
        circ = MCircle((c.x, c.y), e.dxf.radius, fill=False,
                       color="#c0392b", linewidth=1.0, linestyle="--")
        ax.add_patch(circ); n_circles += 1
        try:
            ax.annotate(f"Ø{e.dxf.radius * 2:.1f}", (c.x, c.y),
                        fontsize=7, color="#c0392b",
                        ha="center", va="bottom")
        except Exception:
            pass

    for e in msp.query("LWPOLYLINE"):
        try:
            pts = list(e.get_points(format="xy"))
        except Exception:
            continue
        if not pts:
            continue
        if e.closed:
            pts.append(pts[0])
        # Filter out polys completely outside crop.
        if crop is not None and not any(_in_crop(x, y) for x, y in pts):
            continue
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        color, ls = _layer_color(getattr(e.dxf, "layer", ""))
        ax.plot(xs, ys, color=color, linewidth=1.2, linestyle=ls)
        n_polys += 1

    # Render MTEXT/TEXT labels (small font so they don't crowd the plot).
    for e in msp.query("MTEXT TEXT"):
        try:
            ip = getattr(e.dxf, "insert", None)
            if ip is None:
                continue
            x, y = ip.x, ip.y
            if not _in_crop(x, y):
                continue
            txt = getattr(e, "text", "") or getattr(e.dxf, "text", "")
            if not txt:
                continue
            txt_short = txt.strip().replace("\n", " ")[:32]
            ax.annotate(txt_short, (x, y), fontsize=6, color="#334155",
                        alpha=0.85)
            n_text += 1
        except Exception:
            continue

    if crop is not None:
        ax.set_xlim(crop[0], crop[2])
        ax.set_ylim(crop[1], crop[3])

    ax.set_title(title or os.path.basename(dxf_path),
                 fontsize=11, fontweight="bold", color="#143b62")
    ax.set_xlabel("mm"); ax.set_ylabel("mm")

    # ── Embed canvas + toolbar ──
    canvas = FigureCanvasTkAgg(fig, master=win)
    canvas.draw()
    canvas.get_tk_widget().pack(fill="both", expand=True)

    toolbar_frame = tk.Frame(win)
    toolbar_frame.pack(fill="x")
    toolbar = NavigationToolbar2Tk(canvas, toolbar_frame)
    toolbar.update()

    # Status line at the bottom: entity counts + crop info.
    status = (f"  Lines: {n_lines}   Arcs: {n_arcs}   "
              f"Circles: {n_circles}   Polys: {n_polys}   "
              f"Labels: {n_text}")
    if crop is not None:
        cw = crop[2] - crop[0]
        ch = crop[3] - crop[1]
        status += f"   ⌬ cropped to drawing region {cw:.0f} × {ch:.0f} mm"
    tk.Label(win, text=status, anchor="w",
             bg="#f3eee5", fg="#6e655a",
             font=("Helvetica", 10)).pack(fill="x", side="bottom")

    # Free the matplotlib figure when the window closes — otherwise the
    # backend leaks figures and eventually warns about open figures.
    def _on_close():
        try:
            plt.close(fig)
        except Exception:
            pass
        win.destroy()
    win.protocol("WM_DELETE_WINDOW", _on_close)
