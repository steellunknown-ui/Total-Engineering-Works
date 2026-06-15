"""Nesting viewer — pops up a window with the nesting layout for ONE
part on its currently-selected sheet. Reused by the FAB Sheet's
"Nest" column and (potentially) the Quote tab.
"""
from __future__ import annotations
import os
import tkinter as tk
from tkinter import messagebox

from data.constants import STANDARD_SHEETS
from core.nesting import nest


def open_nesting_viewer(parent, variant, title: str = "") -> None:
    """Open a Toplevel showing the nesting visualization for `variant`
    on its assigned sheet. Red = waste areas + kerf cuts. Blue = parts.
    """
    if variant is None:
        messagebox.showinfo("Nesting", "Pick a part row first."); return
    if not (variant.length and variant.width):
        messagebox.showinfo("Nesting",
            f"{variant.name} has no L × W — can't nest."); return

    dims = STANDARD_SHEETS.get(variant.sheet_name) or (1220, 2440)
    sl, sw = dims
    pl, pw = variant.length, variant.width

    fits = (pl <= sl and pw <= sw) or (pl <= sw and pw <= sl)

    try:
        import matplotlib
        matplotlib.use("TkAgg")
        from matplotlib.figure import Figure
        from matplotlib.backends.backend_tkagg import (
            FigureCanvasTkAgg, NavigationToolbar2Tk)
    except ImportError:
        messagebox.showerror("Nesting",
            "matplotlib is required for the nesting viewer.")
        return

    win = tk.Toplevel(parent)
    win.title(title or f"Nesting — {variant.name}")
    win.geometry("1000x720")
    win.configure(bg='white')

    # Header strip
    hdr = tk.Frame(win, bg='#2b211a', height=48)
    hdr.pack(fill='x'); hdr.pack_propagate(False)
    tk.Label(hdr, text=f"  {variant.name}", bg='#2b211a', fg='white',
             font=("Helvetica", 14, "bold")).pack(side='left', padx=10, pady=10)
    sub = (f"  Part {int(pl)} × {int(pw)} mm  ·  "
           f"Sheet {int(sl)} × {int(sw)} mm  ·  QTY {variant.qty}")
    tk.Label(hdr, text=sub, bg='#2b211a', fg='#d3ccc1',
             font=("Helvetica", 10)).pack(side='left', padx=4, pady=14)

    if not fits:
        # Oversized — show a warning instead of a useless 0% diagram.
        warn = tk.Frame(win, bg='#fee2e2', height=80)
        warn.pack(fill='x'); warn.pack_propagate(False)
        tk.Label(warn, text="WARNING: PART TOO LARGE FOR THE SELECTED SHEET",
                 bg='#fee2e2', fg='#991b1b',
                 font=("Helvetica", 13, "bold")).pack(pady=(12, 0))
        # Suggest a sheet that fits.
        suggested = None
        for name, (a, b) in STANDARD_SHEETS.items():
            if (pl <= a and pw <= b) or (pl <= b and pw <= a):
                suggested = (name, a, b); break
        if suggested:
            tk.Label(warn,
                     text=f"Suggested sheet: {suggested[0]} "
                          f"({int(suggested[1])} × {int(suggested[2])} mm)",
                     bg='#fee2e2', fg='#2b211a',
                     font=("Helvetica", 11, "bold")).pack()
        else:
            tk.Label(warn,
                     text="No standard sheet fits — order custom-cut stock.",
                     bg='#fee2e2', fg='#2b211a',
                     font=("Helvetica", 11, "bold")).pack()
        # Still draw the bbox of the part vs the sheet so the user sees
        # the size mismatch visually.
        fig = Figure(figsize=(9, 6), dpi=95, facecolor='white')
        ax = fig.add_subplot(111)
        from matplotlib.patches import Rectangle
        ax.add_patch(Rectangle((0, 0), sl, sw, fill=False,
                                edgecolor='#2b211a', lw=2))
        ax.add_patch(Rectangle((0, 0), pl, pw, fill=True,
                                facecolor='#fee2e2', edgecolor='#dc2626',
                                lw=2, hatch='xx'))
        ax.text(pl / 2, pw / 2, "PART (too big)",
                ha='center', va='center', fontsize=11,
                fontweight='bold', color='#991b1b')
        margin = max(pl, sl) * 0.05
        ax.set_xlim(-margin, max(pl, sl) + margin)
        ax.set_ylim(-margin, max(pw, sw) + margin)
        ax.set_aspect('equal')
        ax.grid(True, alpha=0.15)
        ax.set_xlabel('mm'); ax.set_ylabel('mm')
        canvas = FigureCanvasTkAgg(fig, master=win)
        canvas.draw()
        canvas.get_tk_widget().pack(fill='both', expand=True)
        tk.Button(win, text="Close", bg='#6e655a', fg='white', bd=0,
                  font=("Helvetica", 11, "bold"), padx=20, pady=6,
                  command=win.destroy).pack(pady=8)
        return

    # ── Render full nesting layout ──
    n = nest(sl, sw, pl, pw, kerf=2, qty=variant.qty,
              name=variant.sheet_name)

    fig = Figure(figsize=(10, 6.5), dpi=95, facecolor='white')
    ax = fig.add_subplot(111)
    pcs, waste = _draw_nest_layout(ax, sl, sw, pl, pw, kerf=2.0, n=n)

    fig.tight_layout()
    canvas = FigureCanvasTkAgg(fig, master=win)
    canvas.draw()
    canvas.get_tk_widget().pack(fill='both', expand=True)
    tb_frame = tk.Frame(win, bg='white'); tb_frame.pack(fill='x')
    NavigationToolbar2Tk(canvas, tb_frame).update()

    # Footer info
    info = (f"  Parts/sheet: {pcs}   ·   Layout: {n.orient}   ·   "
            f"Utilization: {round(100 - waste, 1)}%   ·   Waste: {waste}%   ·   "
            f"Sheets needed for QTY {variant.qty}: {n.sheets}")
    tk.Label(win, text=info, bg='#f3eee5', fg='#2b211a',
             font=("Helvetica", 11, "bold"),
             anchor='w').pack(fill='x', padx=2)


def _draw_nest_layout(ax, sl, sw, pl_in, pw_in, kerf=2.0, n=None):
    """Larger version of quote_preview._draw_nest_panel — bigger fonts,
    part numbers, full legend. Returns (parts_per_sheet, waste_percent).
    """
    import matplotlib.patches as patches
    from matplotlib.lines import Line2D

    if n is None:
        n = nest(sl, sw, pl_in, pw_in, kerf=kerf, qty=1, name="")
    pl_d, pw_d = (pw_in, pl_in) if n.orient == "Rotated 90°" else (pl_in, pw_in)

    min_dim = min(pl_d, pw_d) if pl_d > 0 and pw_d > 0 else 10
    vis_kerf = max(kerf, min_dim * 0.06)
    el, ew = pl_d + vis_kerf, pw_d + vis_kerf
    cols = int(sl // el) if el > 0 else 0
    rows_ = int(sw // ew) if ew > 0 else 0

    # Sheet
    ax.add_patch(patches.Rectangle((0, 0), sl, sw, lw=2.5,
                  edgecolor='#2b211a', facecolor='#f3eee5', zorder=0))

    cnt = 0
    palette = ['#d97706', '#b45309', '#d97706', '#92400e']
    for r in range(rows_):
        for c in range(cols):
            x, y = c * el, r * ew
            # Kerf lines
            if c > 0:
                ax.add_patch(patches.Rectangle(
                    (x - vis_kerf / 4, y), vis_kerf / 2, pw_d + vis_kerf,
                    lw=0, facecolor='#ef4444', alpha=0.85, zorder=2))
            if r > 0:
                ax.add_patch(patches.Rectangle(
                    (x, y - vis_kerf / 4), pl_d + vis_kerf, vis_kerf / 2,
                    lw=0, facecolor='#ef4444', alpha=0.85, zorder=2))
            # Part rectangle
            ax.add_patch(patches.Rectangle(
                (x + vis_kerf / 2, y + vis_kerf / 2), pl_d, pw_d,
                lw=0.7, edgecolor='white', facecolor=palette[cnt % 4],
                alpha=0.9, zorder=3))
            ax.text(x + vis_kerf / 2 + pl_d / 2, y + vis_kerf / 2 + pw_d / 2,
                    f"{cnt + 1}", ha='center', va='center',
                    fontsize=max(6, min(11, int(min_dim / 30))),
                    color='white', fontweight='bold', zorder=4)
            cnt += 1

    # Waste areas
    used_w = cols * el
    used_h = rows_ * ew
    if used_w < sl:
        ax.add_patch(patches.Rectangle(
            (used_w, 0), sl - used_w, sw,
            lw=0, facecolor='#fee2e2', alpha=0.9, hatch='xxx',
            edgecolor='#dc2626', zorder=1))
        if sl - used_w > 30:
            ax.text(used_w + (sl - used_w) / 2, sw / 2, "WASTE",
                    ha='center', va='center', fontsize=12, color='#b91c1c',
                    fontweight='bold', rotation=90, alpha=0.9, zorder=5)
    if used_h < sw:
        ax.add_patch(patches.Rectangle(
            (0, used_h), min(used_w, sl), sw - used_h,
            lw=0, facecolor='#fee2e2', alpha=0.9, hatch='xxx',
            edgecolor='#dc2626', zorder=1))
        if sw - used_h > 30:
            ax.text(min(used_w, sl) / 2, used_h + (sw - used_h) / 2, "WASTE",
                    ha='center', va='center', fontsize=12, color='#b91c1c',
                    fontweight='bold', alpha=0.9, zorder=5)

    waste = round(100.0 - (cnt * pl_d * pw_d) / (sl * sw) * 100.0, 1) \
            if (sl * sw) > 0 else 100.0

    # Legend
    legend_items = [
        Line2D([0], [0], marker='s', color='w', markerfacecolor='#d97706',
               markersize=14, label=f'Part ({int(pl_d)} × {int(pw_d)} mm)'),
        Line2D([0], [0], marker='s', color='w', markerfacecolor='#ef4444',
               markersize=14, label=f'Kerf ({kerf} mm)'),
        Line2D([0], [0], marker='s', color='w', markerfacecolor='#fee2e2',
               markersize=14, label=f'Waste ({waste}%)'),
    ]
    ax.legend(handles=legend_items, loc='upper right', fontsize=9,
               framealpha=0.95)

    margin = max(sl, sw) * 0.04
    ax.set_xlim(-margin, sl + margin)
    ax.set_ylim(-margin, sw + margin)
    ax.set_aspect('equal')
    ax.grid(False)
    ax.set_xlabel(f'Length ({int(sl)} mm)', fontsize=10)
    ax.set_ylabel(f'Width ({int(sw)} mm)', fontsize=10)
    ax.set_title(
        f'{cnt} pcs/sheet · Util {round(100 - waste, 1)}% · Waste {waste}%',
        fontsize=13, fontweight='bold', color='#2b211a', pad=12)
    return cnt, waste



# ═══════════════════════════════════════════════════════════════
#  Group nesting viewer — fast, simple single-sheet navigator.
# ═══════════════════════════════════════════════════════════════

def open_group_nesting_viewer(parent, group_label: str,
                                variants: list,
                                sheet_name: str = "1220 × 2440  (4'×8')"
                                ) -> None:
    """Show how every part in the group packs onto sheets — ONE sheet
    visible at a time with Prev/Next navigation. Designed for speed:
    a single matplotlib figure, redrawn on demand, no tab switching."""
    if not variants:
        messagebox.showinfo("Nesting", "No parts to nest."); return

    dims = STANDARD_SHEETS.get(sheet_name) or (1220, 2440)
    sl, sw = dims

    # ── Expand pieces by qty, sort tallest-first for shelf packing ──
    pieces = []
    for v in variants:
        if not (v.length and v.width):
            continue
        l = max(v.length, v.width)
        h = min(v.length, v.width)
        for _ in range(int(v.qty or 1)):
            pieces.append({"name": v.name, "l": l, "h": h})
    if not pieces:
        messagebox.showinfo("Nesting",
                             "Parts in this group lack dimensions."); return
    pieces.sort(key=lambda p: -p["h"])

    # ── Shelf-fit packing into discrete physical sheets ──
    KERF = 2.0

    def _new_sheet():
        return {"placed": [], "shelves": []}

    # Start EMPTY — sheets are created on demand inside the loop.
    # Pre-creating one always-empty sheet meant a leading "Sheet 1 of N
    # · 0 pieces · 100% waste" panel for groups whose first piece was
    # oversized.
    sheets: list[dict] = []

    def _try_place(p, sht) -> bool:
        for shelf in sht["shelves"]:
            if (shelf["used_l"] + p["l"] + KERF <= sl
                and p["h"] <= shelf["h"]):
                sht["placed"].append({"x": shelf["used_l"], "y": shelf["y"],
                                       "l": p["l"], "h": p["h"],
                                       "name": p["name"]})
                shelf["used_l"] += p["l"] + KERF
                return True
        top = max((s["y"] + s["h"] for s in sht["shelves"]), default=0)
        new_y = top + (KERF if sht["shelves"] else 0)
        if new_y + p["h"] <= sw and p["l"] + KERF <= sl:
            sht["shelves"].append({"y": new_y, "h": p["h"],
                                     "used_l": p["l"] + KERF})
            sht["placed"].append({"x": 0, "y": new_y,
                                    "l": p["l"], "h": p["h"],
                                    "name": p["name"]})
            return True
        return False

    for p in pieces:
        # Try every existing sheet first — small parts that don't fit
        # the latest sheet often DO fit a half-empty earlier sheet.
        # Better packing AND no risk of trailing empty sheets.
        if any(_try_place(p, sht) for sht in sheets):
            continue
        # Open a fresh sheet for this piece.
        new = _new_sheet()
        if _try_place(p, new):
            sheets.append(new)
        else:
            # Oversized — park it alone on its own sheet so it's still
            # visible and the operator can see the size mismatch.
            new["placed"].append({"x": 0, "y": 0,
                                    "l": p["l"], "h": p["h"],
                                    "name": p["name"],
                                    "oversized": True})
            sheets.append(new)

    # Safety net — drop any sheet that somehow ended up empty.
    sheets = [s for s in sheets if s["placed"]]
    if not sheets:
        sheets = [_new_sheet()]   # show at least one (empty) sheet
    n_sheets = len(sheets)

    # ── Stable color per DRG.NO. ──
    palette = ['#d97706', '#b45309', '#92400e', '#fdba74',
                '#ea580c', '#c2410c', '#9a3412', '#7c2d12',
                '#a16207', '#78350f']
    distinct_names = []
    for p in pieces:
        if p["name"] not in distinct_names:
            distinct_names.append(p["name"])
    name_to_color = {n: palette[i % len(palette)]
                      for i, n in enumerate(distinct_names)}

    # Per-sheet utilisation precomputed once.
    sheet_used = [
        sum(q["l"] * q["h"] for q in sht["placed"]
             if not q.get("oversized"))
        for sht in sheets
    ]
    sheet_util = [
        round(used / (sl * sw) * 100, 1) if sl * sw else 0
        for used in sheet_used
    ]
    total_part_area = sum(p["l"] * p["h"] for p in pieces)
    avg_util = round(
        total_part_area / (sl * sw * n_sheets) * 100, 1
    ) if (sl * sw * n_sheets) else 0

    # ── Build the window ──
    try:
        import matplotlib
        matplotlib.use("TkAgg")
        from matplotlib.figure import Figure
        from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
        import matplotlib.patches as patches
    except ImportError:
        messagebox.showerror("Nesting",
            "matplotlib is required for the nesting viewer."); return

    win = tk.Toplevel(parent)
    win.title(f"Nesting — {group_label}")
    win.geometry("1240x820")
    win.minsize(960, 620)
    win.configure(bg='white')

    # Header
    hdr = tk.Frame(win, bg='#2b211a', height=56)
    hdr.pack(fill='x'); hdr.pack_propagate(False)
    tk.Label(hdr, text=f"  {group_label}",
             bg='#2b211a', fg='white',
             font=("Helvetica", 14, "bold")).pack(side='left',
                                                     padx=12, pady=14)
    sub_text = (f"   {len(pieces)} pieces  ·  "
                  f"Stock {int(sl)} × {int(sw)} mm  ·  "
                  f"Avg utilisation {avg_util}%  ·  "
                  f"Combined nest (parts share sheets)")
    tk.Label(hdr, text=sub_text,
             bg='#2b211a', fg='#a8a094',
             font=("Helvetica", 10)).pack(side='left', pady=18)

    cur = [0]   # current sheet index (mutable holder)

    # ── Body — two columns: figure+thumbs (left), callout+parts (right) ──
    body = tk.Frame(win, bg='white')
    body.pack(fill='both', expand=True)

    # Left column: matplotlib figure on top, thumbnail strip below.
    left_col = tk.Frame(body, bg='white')
    left_col.pack(side='left', fill='both', expand=True,
                    padx=(12, 6), pady=12)

    fig = Figure(figsize=(8.2, 5.4), dpi=88, facecolor='white')
    ax = fig.add_subplot(111)
    fig_canvas = FigureCanvasTkAgg(fig, master=left_col)
    fig_canvas.get_tk_widget().pack(side='top', fill='both', expand=True)

    # Thumbnail strip — only rendered when n_sheets > 1.
    thumb_wrap = tk.Frame(left_col, bg='white')
    if n_sheets > 1:
        thumb_wrap.pack(side='top', fill='x', pady=(8, 0))
        tk.Label(thumb_wrap, text="Other sheets — click to switch:",
                 bg='white', fg='#6e655a',
                 font=("Helvetica", 9, 'italic')
                 ).pack(side='top', anchor='w', padx=2, pady=(0, 4))

    thumb_row = tk.Frame(thumb_wrap, bg='white')
    thumb_row.pack(side='top', fill='x')
    thumb_widgets: list[dict] = []   # one entry per sheet thumbnail

    # Right column: big sheet-count callout, then parts list.
    right_col = tk.Frame(body, bg='white', width=300)
    right_col.pack(side='right', fill='y', padx=(0, 12), pady=12)
    right_col.pack_propagate(False)

    # ── Big sheet-count callout — the headline number ──
    callout = tk.Frame(right_col, bg='#fef3e2',
                        highlightbackground='#d97706',
                        highlightthickness=2)
    callout.pack(fill='x', pady=(0, 12))
    tk.Label(callout,
             text=f"{n_sheets}",
             bg='#fef3e2', fg='#d97706',
             font=("Helvetica", 36, 'bold')
             ).pack(pady=(10, 0))
    if n_sheets == 1:
        callout_sub = "SHEET — fits all parts"
    else:
        callout_sub = f"SHEETS REQUIRED\nlike this one"
    tk.Label(callout, text=callout_sub,
             bg='#fef3e2', fg='#2b211a',
             font=("Helvetica", 11, 'bold'),
             justify='center'
             ).pack(pady=(0, 12), padx=8)

    # Parts list panel
    side = tk.Frame(right_col, bg='#faf6ee',
                     highlightbackground='#e5e0d6',
                     highlightthickness=1)
    side.pack(fill='both', expand=True)
    tk.Label(side, text="Parts on this sheet",
             bg='#faf6ee', fg='#2b211a',
             font=("Helvetica", 11, 'bold')).pack(pady=(10, 4), padx=10,
                                                     anchor='w')

    list_frame = tk.Frame(side, bg='#faf6ee')
    list_frame.pack(fill='both', expand=True, padx=10, pady=(0, 10))

    # ── Footer ──
    foot = tk.Frame(win, bg='#f3eee5', height=42)
    foot.pack(fill='x', side='bottom'); foot.pack_propagate(False)
    summary = (f"  {len(pieces)} parts fit on "
                f"{n_sheets} sheet{'s' if n_sheets != 1 else ''} "
                f"(combined nest)  ·  "
                f"Average utilisation {avg_util}%  ·  "
                f"Nesting loss {round(100 - avg_util, 1)}%")
    tk.Label(foot, text=summary, bg='#f3eee5', fg='#2b211a',
             font=("Helvetica", 11, "bold"),
             anchor='w').pack(side='left', padx=12, pady=10)

    # ── Render a single sheet on demand ──
    def _draw_sheet(idx: int):
        ax.clear()
        sht = sheets[idx]
        # Sheet outline + warm fill
        ax.add_patch(patches.Rectangle(
            (0, 0), sl, sw, lw=1.6,
            edgecolor='#2b211a', facecolor='#f3eee5', zorder=0))
        # Pieces
        for q in sht["placed"]:
            color = name_to_color.get(q["name"], '#d97706')
            if q.get("oversized"):
                ax.add_patch(patches.Rectangle(
                    (0, 0), q["l"], q["h"], lw=1.5,
                    edgecolor='#b91c1c', facecolor='#fee2e2',
                    alpha=0.85, hatch='xx', zorder=2))
                ax.text(q["l"] / 2, q["h"] / 2,
                        f"{q['name']}\n(oversize)",
                        ha='center', va='center', fontsize=10,
                        fontweight='bold', color='#991b1b', zorder=3)
                continue
            ax.add_patch(patches.Rectangle(
                (q["x"], q["y"]), q["l"], q["h"],
                lw=0.7, edgecolor='white',
                facecolor=color, alpha=0.92, zorder=2))
            if q["l"] > sl * 0.05 and q["h"] > sw * 0.05:
                ax.text(q["x"] + q["l"] / 2, q["y"] + q["h"] / 2,
                        q["name"][:14],
                        ha='center', va='center',
                        fontsize=max(6, min(11,
                                              int(min(q["l"], q["h"]) / 26))),
                        color='white', fontweight='bold', zorder=3)
        # Waste hatch on the unused right strip
        max_l = max((q["x"] + q["l"] for q in sht["placed"]
                      if not q.get("oversized")), default=0)
        max_h = max((q["y"] + q["h"] for q in sht["placed"]
                      if not q.get("oversized")), default=0)
        if 0 < max_l < sl:
            ax.add_patch(patches.Rectangle(
                (max_l, 0), sl - max_l, max_h or sw,
                lw=0, facecolor='#fee2e2', alpha=0.55,
                hatch='///', edgecolor='#dc2626', zorder=1))
        if 0 < max_h < sw:
            ax.add_patch(patches.Rectangle(
                (0, max_h), sl, sw - max_h,
                lw=0, facecolor='#fee2e2', alpha=0.55,
                hatch='///', edgecolor='#dc2626', zorder=1))
        ax.set_xlim(-30, sl + 30)
        ax.set_ylim(-30, sw + 30)
        ax.set_aspect('equal')
        ax.tick_params(labelsize=8, colors='#6e655a')
        n_pcs = len([q for q in sht["placed"]])
        ax.set_title(
            f"Sheet {idx + 1} of {n_sheets}   ·   "
            f"{n_pcs} pieces   ·   "
            f"Util {sheet_util[idx]}%   ·   "
            f"Waste {round(100 - sheet_util[idx], 1)}%",
            fontsize=12, fontweight='bold', color='#2b211a', pad=8)
        ax.grid(False)
        fig.tight_layout(pad=0.8)
        fig_canvas.draw_idle()

        # Refresh the parts list on the right
        for child in list_frame.winfo_children():
            child.destroy()
        # Count parts by name on this sheet
        by_name: dict[str, int] = {}
        for q in sht["placed"]:
            by_name[q["name"]] = by_name.get(q["name"], 0) + 1
        if by_name:
            for name, cnt in sorted(by_name.items()):
                row = tk.Frame(list_frame, bg='#faf6ee')
                row.pack(fill='x', pady=1)
                tk.Label(row, text="■", bg='#faf6ee',
                         fg=name_to_color.get(name, '#d97706'),
                         font=("Helvetica", 12, 'bold')).pack(side='left')
                tk.Label(row, text=f"  {name}", bg='#faf6ee',
                         fg='#2b211a',
                         font=("Helvetica", 10)).pack(side='left')
                tk.Label(row, text=f"× {cnt}", bg='#faf6ee',
                         fg='#6e655a',
                         font=("Helvetica", 10, 'bold')).pack(side='right')
        else:
            tk.Label(list_frame, text="(empty)",
                     bg='#faf6ee', fg='#6e655a',
                     font=("Helvetica", 10, 'italic')).pack()

        # Update thumbnail highlight — orange border on the active one,
        # warm-grey on the rest.
        for k, t in enumerate(thumb_widgets):
            t["frame"].configure(
                highlightbackground='#d97706' if k == idx else '#e5e0d6',
                highlightthickness=2 if k == idx else 1)

    # ── Build thumbnails (only when n_sheets > 1) ──
    THUMB_W = 88
    THUMB_H = 56
    PER_ROW_MAX = 12

    def _build_thumb(parent: tk.Frame, k: int) -> tk.Frame:
        """Render thumbnail for sheet `k` into `parent` and return its
        outer Frame so the caller can record it for highlight updates."""
        sht = sheets[k]
        outer = tk.Frame(parent, bg='white',
                          highlightbackground='#e5e0d6',
                          highlightthickness=1, cursor='hand2')
        outer.pack(side='left', padx=2, pady=2)
        cv = tk.Canvas(outer, width=THUMB_W, height=THUMB_H,
                        bg='#f3eee5', bd=0, highlightthickness=0,
                        cursor='hand2')
        cv.pack(padx=1, pady=1)
        sx = (THUMB_W - 2) / sl if sl else 1
        sy = (THUMB_H - 2) / sw if sw else 1
        oversize_flag = False
        for q in sht["placed"]:
            color = name_to_color.get(q["name"], '#d97706')
            if q.get("oversized"):
                oversize_flag = True
                cv.create_rectangle(
                    1, 1, THUMB_W - 1, THUMB_H - 1,
                    fill='#fee2e2', outline='#b91c1c', width=1)
                cv.create_text(THUMB_W / 2, THUMB_H / 2,
                                text="!", fill='#991b1b',
                                font=("Helvetica", 14, "bold"))
                continue
            x0 = 1 + q["x"] * sx
            y0 = 1 + q["y"] * sy
            x1 = 1 + (q["x"] + q["l"]) * sx
            y1 = 1 + (q["y"] + q["h"]) * sy
            cv.create_rectangle(x0, y0, x1, y1,
                                  fill=color, outline='', width=0)
        lbl_text = f"{k + 1}  (oversize)" if oversize_flag else f"{k + 1}"
        tk.Label(outer,
                 text=f"{lbl_text}  ·  {sheet_util[k]:.0f}%",
                 bg='white', fg='#2b211a',
                 font=("Helvetica", 9, 'bold')
                 ).pack(pady=(0, 2), padx=4)

        def _on_click(_e=None, i=k):
            cur[0] = i
            _draw_sheet(i)
        outer.bind("<Button-1>", _on_click)
        cv.bind("<Button-1>", _on_click)
        for child in outer.winfo_children():
            child.bind("<Button-1>", _on_click)
        return outer

    if n_sheets > 1:
        # Lay out thumbnails in rows of PER_ROW_MAX so big groups
        # (>12 sheets) wrap onto multiple rows.
        row_frames: list[tk.Frame] = []
        for k in range(n_sheets):
            if k % PER_ROW_MAX == 0:
                rf = tk.Frame(thumb_row, bg='white')
                rf.pack(side='top', fill='x', anchor='w', pady=1)
                row_frames.append(rf)
            tw = _build_thumb(row_frames[-1], k)
            thumb_widgets.append({"frame": tw, "idx": k})

    def _go(delta):
        new = max(0, min(n_sheets - 1, cur[0] + delta))
        if new != cur[0]:
            cur[0] = new
            _draw_sheet(new)

    # Keyboard shortcuts: Left / Right arrows still navigate sheets.
    win.bind("<Left>",  lambda e: _go(-1))
    win.bind("<Right>", lambda e: _go(+1))

    # Initial draw
    _draw_sheet(0)
