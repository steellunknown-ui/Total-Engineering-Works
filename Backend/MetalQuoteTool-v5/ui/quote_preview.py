"""Quote Preview — pops up a window with a full-quote summary built
from the FAB sheet's parts list.

Shows per-material breakdown:
  • parts and total qty
  • total weight (kg)
  • sheets required + nesting utilisation
  • a visual nesting layout for the largest part on one sheet,
    with red WASTE / kerf overlay so the operator can see where
    material is being lost
  • material cost (if rates available) + grand total

The same preview is opened from the FAB Sheet tab via the new "Quote" button.
"""
from __future__ import annotations
import math
import datetime
import tkinter as tk
from tkinter import ttk

import os
from tkinter import filedialog, messagebox

from core.nesting import nest
from data.constants import (STANDARD_SHEETS, DENSITY,
                              STD_RATES_PER_KG, MATERIAL_RATE_PER_KG,
                              material_rate, material_rate_band,
                              QUOTE_BUFFER_DEFAULT_PCT)


# ── Per-material rate lookup ──
# Source: Steel_Rate_Card_Nashik_Apr2026.xlsx → MATERIAL_RATE_BANDS in
# data/constants.py. Picks the band whose upper-thickness bound covers
# the part. The buffer % is operator-controlled — see the entry in the
# Quote Preview toolbar (default 0%).
def _rate_per_kg(material: str, thickness: float | None,
                   buffer_pct: float = 0.0) -> float | None:
    return material_rate(material, thickness, buffer_pct=buffer_pct)


def _landed_rate_per_kg(material: str,
                          thickness: float | None) -> float | None:
    """Landed mid-rate (no buffer) — shown alongside the quote rate
    so the operator sees both the cost basis and the customer price."""
    return material_rate(material, thickness, buffer_pct=0)


def _process_rate_per_kg(process: str) -> float:
    """Sum the ₹/kg operation rates implied by the variant's PROCESS
    string. Recognises PUNCHING / BENDING / WELDING / POWER COATING
    keywords (case-insensitive)."""
    if not process:
        return 0.0
    p = process.upper()
    rate = 0.0
    if "PUNCH" in p:
        rate += STD_RATES_PER_KG.get("punching", 0)
    if "BEND" in p:
        rate += STD_RATES_PER_KG.get("bending", 0)
    if "WELD" in p:
        rate += STD_RATES_PER_KG.get("welding", 0)
    if "POWDER" in p or "POWER COAT" in p or "PC " in p or "DUAL" in p:
        rate += STD_RATES_PER_KG.get("powder_coating_dual", 0)
    return rate


def _weight_kg(length: float, width: float, thickness: float,
                material: str, qty: int = 1) -> float:
    """L × W × T × density (g/cm³) / 1e6 × qty."""
    rho = DENSITY.get(material, 7850) / 1000.0   # → g/cm³
    return round(length * width * thickness * rho / 1_000_000 * qty, 3)


def _canonical(mat: str | None) -> str:
    """Same canonicalisation rule as tab_fab_sheet — keep them in sync
    so the Quote groups match the FAB sheet groups visually."""
    from ui.tab_fab_sheet import _canonical_material
    return _canonical_material(mat)


def _group_label(material: str | None, thickness: float | None) -> str:
    """Bucket key shared with the FAB sheet — material + thickness."""
    from ui.tab_fab_sheet import _group_key_from
    return _group_key_from(material, thickness)


def _draw_nest_panel(ax, sl: float, sw: float, pl: float, pw: float,
                      kerf: float = 2.0) -> tuple[int, float]:
    """Render a nesting diagram on the given matplotlib axes.
    Red = WASTE area + kerf cuts. Blue = parts.
    Returns (parts_per_sheet, waste_percent).
    """
    import matplotlib.patches as patches

    n = nest(sl, sw, pl, pw, kerf=kerf, qty=1, name="")
    if n.orient == "Rotated 90°":
        pl_d, pw_d = pw, pl
    else:
        pl_d, pw_d = pl, pw

    # Visible kerf — exaggerated so the cut lines actually show on small parts.
    min_dim = min(pl_d, pw_d) if pl_d > 0 and pw_d > 0 else 10
    vis_kerf = max(kerf, min_dim * 0.06)
    el, ew = pl_d + vis_kerf, pw_d + vis_kerf
    cols = int(sl // el) if el > 0 else 0
    rows_ = int(sw // ew) if ew > 0 else 0

    # Sheet background
    ax.add_patch(patches.Rectangle((0, 0), sl, sw,
                  lw=2, edgecolor='#2b211a', facecolor='#f3eee5', zorder=0))

    cnt = 0
    for r in range(rows_):
        for c in range(cols):
            x, y = c * el, r * ew
            # kerf cuts (red lines between parts)
            if c > 0:
                ax.add_patch(patches.Rectangle(
                    (x - vis_kerf / 4, y), vis_kerf / 2, pw_d + vis_kerf,
                    lw=0, facecolor='#ef4444', alpha=0.85, zorder=2))
            if r > 0:
                ax.add_patch(patches.Rectangle(
                    (x, y - vis_kerf / 4), pl_d + vis_kerf, vis_kerf / 2,
                    lw=0, facecolor='#ef4444', alpha=0.85, zorder=2))
            ax.add_patch(patches.Rectangle(
                (x + vis_kerf / 2, y + vis_kerf / 2), pl_d, pw_d,
                lw=0.6, edgecolor='white', facecolor='#d97706',
                alpha=0.85, zorder=3))
            cnt += 1

    # ── WASTE areas — bright red hatch ──
    used_w = cols * el
    used_h = rows_ * ew
    if used_w < sl:
        ax.add_patch(patches.Rectangle(
            (used_w, 0), sl - used_w, sw,
            lw=0, facecolor='#fee2e2', alpha=0.9, hatch='xxx',
            edgecolor='#dc2626', zorder=1))
        if sl - used_w > 30:
            ax.text(used_w + (sl - used_w) / 2, sw / 2, "WASTE",
                    ha='center', va='center', fontsize=9, color='#b91c1c',
                    fontweight='bold', rotation=90, alpha=0.9, zorder=5)
    if used_h < sw:
        ax.add_patch(patches.Rectangle(
            (0, used_h), min(used_w, sl), sw - used_h,
            lw=0, facecolor='#fee2e2', alpha=0.9, hatch='xxx',
            edgecolor='#dc2626', zorder=1))
        if sw - used_h > 30:
            ax.text(min(used_w, sl) / 2, used_h + (sw - used_h) / 2, "WASTE",
                    ha='center', va='center', fontsize=9, color='#b91c1c',
                    fontweight='bold', alpha=0.9, zorder=5)

    waste = round(100.0 - (cnt * pl_d * pw_d) / (sl * sw) * 100.0, 1) \
            if (sl * sw) > 0 else 100.0
    ax.set_xlim(-30, sl + 30)
    ax.set_ylim(-30, sw + 30)
    ax.set_aspect('equal')
    ax.tick_params(labelsize=7, colors='#6e655a')
    ax.set_title(
        f"{cnt} pcs/sheet · Util {round(100 - waste, 1)}% · Waste {waste}%",
        fontsize=10, fontweight='bold', color='#2b211a')
    return cnt, waste


def open_quote_preview(parent, parts, app=None,
                          buffer_pct: float = 0.0) -> None:
    """Build & display the quote preview window. The on-screen preview
    is text/Treeview only — nesting diagrams are rendered into the PDF
    by `_write_quote_pdf` and viewed live from the FAB sheet's Nest
    column.
    """
    from tkinter import messagebox
    if not parts:
        messagebox.showinfo("Quote", "Upload files first to build a quote.")
        return

    # ── Aggregate per canonical material ──
    groups: dict[str, list] = {}
    for p in parts:
        for v in p.variants:
            key = _group_label(v.material, v.thickness)
            groups.setdefault(key, []).append(v)

    win = tk.Toplevel(parent)
    win.title("Quote Preview")
    win.geometry("1520x880")
    win.minsize(1280, 720)
    win.configure(bg='#faf6ee')

    # Captured per-group rows for the PDF exporter (filled below as each
    # material card is rendered).
    pdf_data: dict = {"groups": [], "grand": {},
                       "buffer_pct": float(buffer_pct or 0)}

    def _close_window():
        try:
            canvas_scroll.unbind_all('<MouseWheel>')
        except Exception:
            pass
        win.destroy()

    def _save_pdf():
        if not pdf_data["groups"]:
            messagebox.showinfo("Save PDF", "Nothing to save."); return
        default = f"Quote_{datetime.date.today().isoformat()}.pdf"
        fp = filedialog.asksaveasfilename(
            parent=win,
            title="Save Quote as PDF",
            defaultextension=".pdf",
            initialfile=default,
            filetypes=[("PDF document", "*.pdf")])
        if not fp: return
        try:
            _write_quote_pdf(fp, pdf_data)
        except Exception as e:
            messagebox.showerror("Save PDF", f"Couldn't save:\n{e}"); return
        messagebox.showinfo("Saved",
            f"Quote saved to:\n{fp}", parent=win)

    # ── Restrained palette: Charcoal & Burnt Orange ──
    INK     = '#2b211a'    # primary dark — headers, body text on light bg
    SLATE   = '#3a2e25'    # secondary dark — toolbar, card sub-headers
    BORDER  = '#e5e0d6'    # warm 1-px hairlines on cards
    SUBTLE  = '#f3eee5'    # very faint card-interior strip (warm)
    BODY_BG = '#faf6ee'    # warm off-white window background
    MUTED   = '#6e655a'    # secondary text (captions, units)
    ACCENT  = '#d97706'    # burnt orange — the SINGLE accent

    # ── Header — single dark band, no double accents ──
    hdr = tk.Frame(win, bg=INK, height=72)
    hdr.pack(fill='x'); hdr.pack_propagate(False)
    inner_hdr = tk.Frame(hdr, bg=INK)
    inner_hdr.pack(fill='both', expand=True, padx=28, pady=12)

    title_block = tk.Frame(inner_hdr, bg=INK)
    title_block.pack(side='left', anchor='w')
    tk.Label(title_block, text="QUOTE PREVIEW",
             bg=INK, fg='white',
             font=("Helvetica", 18, "bold")).pack(anchor='w')
    tk.Label(title_block,
             text="Per-material breakdown · Nesting loss · Process cost",
             bg=INK, fg='#a8a094',
             font=("Helvetica", 10)).pack(anchor='w', pady=(2, 0))

    tk.Label(
        inner_hdr,
        text=datetime.date.today().strftime('%d %B %Y'),
        bg=INK, fg='#a8a094',
        font=("Helvetica", 11)).pack(side='right', anchor='e', pady=8)

    # 1-px subtle separator (no coloured accent line — it competed for
    # attention with the dark header)
    tk.Frame(win, bg=BORDER, height=1).pack(fill='x')

    # ── Toolbar (Back / Buffer % / Save to PDF) ──
    from ui.theme import _btn as _theme_btn
    bar = tk.Frame(win, bg=SLATE, height=48)
    bar.pack(fill='x'); bar.pack_propagate(False)
    # Back: white outline-style — neutral, low-emphasis
    _theme_btn(bar, "← Back", 'white', INK, _close_window,
                size=10, px=18, py=5,
                hover='#e2e8f0').pack(side='left', padx=(18, 6), pady=8)
    # Save to PDF: solid accent — primary action
    _theme_btn(bar, "Save to PDF", ACCENT, 'white', _save_pdf,
                size=10, px=20, py=5,
                hover='#039e9f').pack(side='right', padx=(6, 18), pady=8)

    # ── Buffer-% control — sits centre-left of the toolbar ──
    # Default 0 → no markup over the landed rate. Operator types a
    # number and presses "Apply" (or hits Enter) to re-quote with that
    # percentage tacked on the material rate.
    buf_box = tk.Frame(bar, bg=SLATE)
    buf_box.pack(side='left', padx=(20, 0), pady=8)
    tk.Label(buf_box, text="Buffer %:", bg=SLATE, fg='white',
             font=("Helvetica", 10, "bold")).pack(side='left')
    buf_var = tk.StringVar(value=f"{int(buffer_pct):d}"
                                if float(buffer_pct).is_integer()
                                else f"{buffer_pct:g}")
    buf_entry = tk.Entry(buf_box, textvariable=buf_var, width=5,
                          font=("Helvetica", 10, "bold"),
                          bg='white', fg=INK,
                          relief='solid', bd=1,
                          justify='center')
    buf_entry.pack(side='left', padx=(8, 6), ipady=2)

    def _apply_buffer(*_):
        try:
            new_pct = float(buf_var.get() or 0)
        except ValueError:
            messagebox.showinfo("Invalid",
                "Buffer must be a number (e.g. 0, 10, 30).",
                parent=win)
            return
        # Re-open with the new buffer — simplest reliable refresh.
        _close_window()
        open_quote_preview(parent, parts, app=app,
                             buffer_pct=new_pct)

    buf_entry.bind("<Return>", _apply_buffer)
    _theme_btn(buf_box, "Apply", '#3a2e25', 'white', _apply_buffer,
                size=10, px=12, py=4,
                hover='#4d3e33').pack(side='left', padx=(0, 4))
    # Hint
    tk.Label(buf_box, text="(0 = landed cost · increase to add markup)",
             bg=SLATE, fg='#a8a094',
             font=("Helvetica", 9, "italic")).pack(side='left', padx=(8, 0))

    # ── STD RM RATE FORMAT strip — clean white card, no rainbow ──
    rate_strip = tk.Frame(win, bg='white', height=86,
                           highlightbackground=BORDER,
                           highlightthickness=1)
    rate_strip.pack(fill='x', padx=14, pady=(12, 6))
    rate_strip.pack_propagate(False)

    # Title block on the left (neutral)
    title_block = tk.Frame(rate_strip, bg='white')
    title_block.pack(side='left', padx=(18, 22), pady=12)
    tk.Label(title_block, text="STD RM RATE FORMAT",
             bg='white', fg=INK,
             font=("Helvetica", 11, "bold")).pack(anchor='w')
    tk.Label(title_block, text="₹/kg of part weight",
             bg='white', fg=MUTED,
             font=("Helvetica", 9)).pack(anchor='w', pady=(1, 0))

    # Operations only — material rates are shown per-card (each material
    # has its own ₹/kg) so they don't belong in this operations total.
    _rate_data = [
        ("Punching",        STD_RATES_PER_KG.get("punching", 0)),
        ("Bending",         STD_RATES_PER_KG.get("bending", 0)),
        ("Welding & Fab.",  STD_RATES_PER_KG.get("welding", 0)),
        ("Powder Coating",  STD_RATES_PER_KG.get("powder_coating_dual", 0)),
    ]
    # Operation cells — uniform white-on-slate-border, NO accent stripes.
    # Each cell is the same height, separated by a 1-px hairline so the
    # row reads as a single table.
    for op, rate in _rate_data:
        cell = tk.Frame(rate_strip, bg=SUBTLE,
                         highlightbackground=BORDER,
                         highlightthickness=1)
        cell.pack(side='left', padx=2, pady=14)
        tk.Label(cell, text=op, bg=SUBTLE, fg=MUTED,
                 font=("Helvetica", 9)).pack(padx=16, pady=(6, 0))
        tk.Label(cell, text=f"₹{rate:.2f}", bg=SUBTLE, fg=INK,
                 font=("Helvetica", 13, "bold")).pack(padx=16, pady=(0, 6))

    # Total cell — the ONE place we use the accent colour, signalling
    # "this is the bottom-line number".
    _rate_total = sum(r[1] for r in _rate_data)
    total_cell = tk.Frame(rate_strip, bg=ACCENT)
    total_cell.pack(side='left', padx=(8, 16), pady=14)
    tk.Label(total_cell, text="TOTAL", bg=ACCENT, fg='white',
             font=("Helvetica", 9, "bold")).pack(padx=18, pady=(6, 0))
    tk.Label(total_cell, text=f"₹{_rate_total:.2f}",
             bg=ACCENT, fg='white',
             font=("Helvetica", 14, "bold")).pack(padx=18, pady=(0, 6))

    # ── Scrollable body ──
    body_wrap = tk.Frame(win, bg='#faf6ee')
    body_wrap.pack(fill='both', expand=True)
    canvas_scroll = tk.Canvas(body_wrap, bg='#faf6ee',
                              highlightthickness=0)
    sb = ttk.Scrollbar(body_wrap, orient='vertical',
                       command=canvas_scroll.yview)
    canvas_scroll.configure(yscrollcommand=sb.set)
    sb.pack(side='right', fill='y')
    canvas_scroll.pack(side='left', fill='both', expand=True)
    body = tk.Frame(canvas_scroll, bg='#faf6ee')
    canvas_scroll.create_window((0, 0), window=body, anchor='nw')
    body.bind('<Configure>', lambda e: canvas_scroll.configure(
              scrollregion=canvas_scroll.bbox('all')))
    # Mouse-wheel scrolling.
    def _on_wheel(e):
        canvas_scroll.yview_scroll(int(-e.delta / 2), 'units')
    canvas_scroll.bind_all('<MouseWheel>', _on_wheel)
    win.protocol("WM_DELETE_WINDOW", _close_window)

    # ── Grand totals (computed as we render groups) ──
    grand_qty = 0
    grand_weight = 0.0
    grand_sheets = 0
    grand_mat_cost = 0.0
    grand_proc_cost = 0.0
    grand_total_cost = 0.0
    grand_sheet_weight = 0.0
    grand_part_area = 0.0
    grand_sheet_area = 0.0

    # Sort: specified groups alphabetically first, then anything with
    # "(unspecified)" material OR an unknown thickness ("· ?") last.
    def _group_sort_key(label: str):
        is_unknown = ("(unspecified)" in label) or label.endswith("· ?")
        return (1 if is_unknown else 0, label)

    for material in sorted(groups, key=_group_sort_key):
        variants = groups[material]
        # The combined group key is "<Material> · <Thickness> mm" so we
        # can extract the exact thickness rather than guessing it from
        # the most-common variant's value.
        rep_thk = None
        if "·" in material:
            tail = material.split("·")[-1].strip()
            try:
                rep_thk = float(tail.replace("mm", "").strip())
            except ValueError:
                rep_thk = None
        if rep_thk is None:
            thicknesses = [v.thickness for v in variants if v.thickness]
            rep_thk = (max(set(thicknesses), key=thicknesses.count)
                        if thicknesses else None)
        # Pure-material name (without "· thickness" suffix) for the band lookup.
        pure_mat = material.split("·")[0].strip()
        landed_rate = _landed_rate_per_kg(pure_mat, rep_thk)
        rate_kg = _rate_per_kg(pure_mat, rep_thk,
                                  buffer_pct=buffer_pct)
        # Optional band tuple for the on-card label.
        band = material_rate_band(pure_mat, rep_thk)

        # Per-group totals
        g_qty = 0; g_weight = 0.0; g_sheets = 0; g_cost = 0.0
        g_part_area = 0.0; g_sheet_area = 0.0
        g_sheet_weight = 0.0   # full-sheet weight consumed (incl. waste)
        g_mat_cost = 0.0       # raw-material cost (sheet_weight × material_rate)
        g_proc_cost = 0.0      # operation cost (part_weight × process_rate)
        # Captured rows for the PDF.
        pdf_rows: list = []

        # Build the card — white panel with a single dark header strip
        # and a 1-px slate border. No nested pills, no decorative icons.
        card = tk.Frame(body, bg='white',
                          highlightbackground=BORDER,
                          highlightthickness=1)
        card.pack(fill='x', expand=True, padx=18, pady=10)

        # Single dark header — material name (bold, big) + part count
        # (muted, small) on the left; material rate (muted, small) on
        # the right. No coloured chips, no accents inside the header.
        ch = tk.Frame(card, bg=INK, height=44)
        ch.pack(fill='x'); ch.pack_propagate(False)

        ch_left = tk.Frame(ch, bg=INK)
        ch_left.pack(side='left', fill='y', padx=18, pady=10)
        tk.Label(ch_left, text=material,
                 bg=INK, fg='white',
                 font=("Helvetica", 13, "bold")).pack(side='left')
        n_parts_lbl = (f"   {len(variants)} part"
                        f"{'s' if len(variants) != 1 else ''}")
        tk.Label(ch_left, text=n_parts_lbl,
                 bg=INK, fg='#a8a094',
                 font=("Helvetica", 10)).pack(side='left')

        if rate_kg is not None:
            # Right-side rate block — bold price on top. When the
            # operator has dialled in a buffer, a small badge below
            # the price shows the percentage so it's visible on every
            # card that the markup is live.
            rate_block = tk.Frame(ch, bg=INK)
            rate_block.pack(side='right', padx=18, pady=4)
            tk.Label(rate_block,
                     text=f"Price  ₹{rate_kg:.2f}/kg",
                     bg=INK, fg=ACCENT,
                     font=("Helvetica", 12, "bold")).pack(anchor='e')
            if buffer_pct and buffer_pct > 0:
                tk.Label(rate_block,
                         text=f"  +{buffer_pct:g}% buffer applied  ",
                         bg=ACCENT, fg='white',
                         font=("Helvetica", 9, "bold"),
                         padx=2).pack(anchor='e', pady=(2, 0))

        # Single-column body — full-width parts table only. The nesting
        # visual is no longer rendered here (it ships with the PDF and
        # the FAB-sheet "Nest" column instead).
        row = tk.Frame(card, bg='white'); row.pack(fill='both', expand=True,
                                                      padx=12, pady=10)
        left = tk.Frame(row, bg='white'); left.pack(side='top',
                                                       fill='both', expand=True)
        # `right` lives BELOW the table now so it doesn't steal width
        # from the parts table when it's idle (it only has content for
        # oversized-part warnings).
        right = tk.Frame(row, bg='white'); right.pack(side='top', fill='x',
                                                         pady=(4, 0))

        # ── Parts table ──
        cols = ("DRG.NO.", "DESC", "T", "L", "W", "QTY",
                "Wt(kg)", "Sheet", "Sht", "Process",
                "Mat ₹", "Proc ₹", "Total ₹")
        # Wrap the Treeview in a frame with horizontal scrollbar — gives
        # the table a "safety net" if the user resizes the window
        # narrower than the column widths add up to. Vertical scrolling
        # is handled by the outer canvas.
        tv_wrap = tk.Frame(left, bg='white')
        tv_wrap.pack(fill='both', expand=True)
        tv = ttk.Treeview(tv_wrap, columns=cols, show='headings', height=8)
        h_scroll = ttk.Scrollbar(tv_wrap, orient='horizontal',
                                  command=tv.xview)
        tv.configure(xscrollcommand=h_scroll.set)
        h_scroll.pack(side='bottom', fill='x')
        tv.pack(side='top', fill='both', expand=True)

        # Widths chosen to SUM comfortably under the available card width
        # (~1430 px in a 1520-wide window) so every column — including the
        # rightmost "Total ₹" — is visible without scrolling on default
        # window size. NO programmatic upscaling — Tk would over-shoot
        # past the right edge on macOS Aqua.
        widths = {"DRG.NO.":  98, "DESC":    180, "T":   34, "L": 50,
                  "W":        50, "QTY":      40, "Wt(kg)": 65,
                  "Sheet":   120, "Sht":      34, "Process": 165,
                  "Mat ₹":    78, "Proc ₹":   62, "Total ₹": 80}
        # Sum ≈ 1056 px — leaves visible margin even after Treeview's
        # internal padding + the vertical scrollbar.
        for c in cols:
            tv.heading(c, text=c)
            tv.column(c, width=widths[c], minwidth=40,
                       stretch=False,        # never grow past visible area
                       anchor='w' if c in ("DRG.NO.", "DESC", "Sheet",
                                            "Process") else 'e')

        # ── Pick the part to visualise ──
        # Skip parts that DON'T FIT on their chosen sheet (they'd render
        # as 0 pcs / 100% waste, which is useless). Among the fitting
        # parts, prefer the largest by area so the operator sees the
        # tightest realistic packing.
        # Also collect oversized parts so we can flag them separately.
        biggest_v = None; biggest_area = 0.0
        oversized: list = []
        for v in variants:
            if not (v.length and v.width):
                continue
            dims = STANDARD_SHEETS.get(v.sheet_name) or (1220, 2440)
            sl, sw = dims
            # Fits in either orientation?
            fits = ((v.length <= sl and v.width <= sw)
                    or (v.length <= sw and v.width <= sl))
            if not fits:
                oversized.append((v, dims))
                continue
            a = v.length * v.width
            if a > biggest_area:
                biggest_area = a; biggest_v = v

        # If everything's oversized, look for ANY standard sheet big
        # enough to hold the smallest oversized part — that's the sheet
        # the operator should switch to.
        suggested_sheet = None
        if biggest_v is None and oversized:
            small_o = min(oversized, key=lambda t: t[0].length * t[0].width)
            ov, _ = small_o
            for name, (sl, sw) in STANDARD_SHEETS.items():
                fits = ((ov.length <= sl and ov.width <= sw)
                        or (ov.length <= sw and ov.width <= sl))
                if fits:
                    suggested_sheet = (name, sl, sw, ov)
                    break

        for v in variants:
            dims = STANDARD_SHEETS.get(v.sheet_name)
            sheet_label = (v.sheet_name or "").split("(")[0].strip()
            sheet_kg_one = 0.0          # weight of ONE full sheet at this T
            if v.length and v.width and v.thickness and dims:
                sl, sw = dims
                fits = ((v.length <= sl and v.width <= sw)
                        or (v.length <= sw and v.width <= sl))
                # Reference material for the density/weight calc —
                # use the pure-material name (without "· thickness" suffix).
                ref_mat = (pure_mat if pure_mat and
                            pure_mat != "(unspecified)"
                            else (v.material or "MS Sheet"))
                # One full sheet's weight at the part's thickness.
                sheet_kg_one = _weight_kg(sl, sw, v.thickness, ref_mat, qty=1)
                if fits:
                    n = nest(sl, sw, v.length, v.width, kerf=2,
                              qty=v.qty, name=v.sheet_name)
                    sheets = n.sheets
                    g_part_area += v.length * v.width * v.qty
                    g_sheet_area += sl * sw * sheets
                    sheet_kg_total = sheet_kg_one * sheets
                else:
                    # Oversized — assume 1 part per (custom-cut) sheet so
                    # the cost/weight columns still reflect material need.
                    # Append a marker to the sheet column so it's obvious.
                    sheets = v.qty
                    sheet_label = f"TOO BIG ({sheet_label})"
                    g_part_area += v.length * v.width * v.qty
                    # Sheet area = part bbox (custom-cut) — loss for this
                    # row is 0 because the operator orders custom stock at
                    # part dimensions, paying for only the part's weight.
                    g_sheet_area += v.length * v.width * v.qty
                    sheet_kg_total = _weight_kg(v.length, v.width,
                                                 v.thickness, ref_mat,
                                                 qty=v.qty)
                # Part weight (the deliverable).
                wt = _weight_kg(v.length, v.width, v.thickness,
                                 ref_mat, qty=v.qty)
                # ── New cost model — split material vs. process ──
                # Material cost is based on ACTUAL sheet weight consumed
                # (so it includes the nesting waste / offcut that the
                # operator pays for). Process cost is based on the part
                # weight (operations only touch the part).
                proc_rate = _process_rate_per_kg(v.process)
                row_mat_cost = round(sheet_kg_total * (rate_kg or 0), 2)
                row_proc_cost = round(wt * proc_rate, 2)
                cost = round(row_mat_cost + row_proc_cost, 2)
                g_sheet_weight += sheet_kg_total
                g_mat_cost += row_mat_cost
                g_proc_cost += row_proc_cost
            else:
                sheets = 0; wt = 0.0; cost = 0.0
            g_qty += int(v.qty or 0)
            g_weight += wt
            g_sheets += sheets
            g_cost += cost
            # Process column for the table (compact).
            proc_short = (v.process or "")
            if len(proc_short) > 22:
                proc_short = proc_short[:20] + "…"
            try:
                row_mat = row_mat_cost
                row_proc = row_proc_cost
            except NameError:
                row_mat = 0; row_proc = 0
            row_vals = (
                v.name,
                (v.description or "")[:30],
                v.thickness if v.thickness is not None else "",
                int(v.length) if v.length else "",
                int(v.width) if v.width else "",
                v.qty,
                f"{wt:.2f}" if wt else "",
                sheet_label,
                sheets if sheets else "",
                proc_short,
                f"{row_mat:,.0f}" if row_mat else "",
                f"{row_proc:,.0f}" if row_proc else "",
                f"{cost:,.0f}" if cost else "",
            )
            tv.insert('', 'end', values=row_vals)
            pdf_rows.append(row_vals)

        # ── Status line in lieu of the nesting diagram ──
        # Diagrams now ship with the PDF (one per part) and the FAB
        # sheet's "Nest" column. Keep the warning panel for groups whose
        # parts are ALL oversized.
        if biggest_v and oversized:
            warn = (f"NOTE: {len(oversized)} part(s) too big for the chosen "
                     f"sheet — see TOO BIG marker in the table.")
            tk.Label(right, text=warn, bg='white', fg='#b91c1c',
                     font=("Helvetica", 10, "bold"),
                     anchor='w').pack(side='left', padx=8, pady=4)
        elif oversized:
            # NO part in this group fits — show a warning panel instead
            # of a useless 0%-utilisation diagram.
            warn_box = tk.Frame(right, bg='#fee2e2', bd=1, relief='solid')
            warn_box.pack(padx=4, pady=4)
            ov_v, ov_dims = oversized[0]
            tk.Label(warn_box, text="WARNING: PART TOO LARGE FOR SHEET",
                     bg='#fee2e2', fg='#991b1b',
                     font=("Helvetica", 11, "bold")).pack(padx=12, pady=(8, 2))
            tk.Label(warn_box,
                     text=f"{ov_v.name}: {int(ov_v.length)} × {int(ov_v.width)} mm\n"
                          f"Sheet: {int(ov_dims[0])} × {int(ov_dims[1])} mm",
                     bg='#fee2e2', fg='#7f1d1d',
                     font=("Helvetica", 10)).pack(padx=12, pady=2)
            if suggested_sheet is not None:
                name, sl, sw, _ov = suggested_sheet
                tk.Label(warn_box,
                         text=f"\nSuggested sheet:\n  {name}\n  ({int(sl)} × {int(sw)} mm)",
                         bg='#fee2e2', fg='#2b211a',
                         font=("Helvetica", 10, "bold")).pack(padx=12, pady=(2, 6))
            else:
                tk.Label(warn_box,
                         text="\nNo standard sheet fits this part.\n"
                              "Order custom-cut stock.",
                         bg='#fee2e2', fg='#2b211a',
                         font=("Helvetica", 10, "bold")).pack(padx=12, pady=(2, 6))
            if len(oversized) > 1:
                tk.Label(warn_box,
                         text=f"+ {len(oversized) - 1} other oversized part(s)",
                         bg='#fee2e2', fg='#7f1d1d',
                         font=("Helvetica", 9, "italic")).pack(padx=12, pady=(0, 8))

        # ── Per-group footer — neutral grey strip with structured rows ──
        # Replaces the old yellow + amber double-strip that fought the
        # rest of the page for attention.
        nest_loss_pct = (round((1 - g_part_area / g_sheet_area) * 100, 1)
                         if g_sheet_area > 0 else 0.0)
        waste_cost = round(g_mat_cost * nest_loss_pct / 100, 2)

        ft = tk.Frame(card, bg=SUBTLE,
                       highlightbackground=BORDER,
                       highlightthickness=0)
        ft.pack(fill='x', padx=0, pady=(0, 0))
        # Top divider line
        tk.Frame(ft, bg=BORDER, height=1).pack(fill='x')

        ft_inner = tk.Frame(ft, bg=SUBTLE)
        ft_inner.pack(fill='x', padx=18, pady=10)

        def _kv(parent, label, value, bold_value=False, value_fg=INK):
            cell = tk.Frame(parent, bg=SUBTLE)
            cell.pack(side='left', padx=(0, 26))
            tk.Label(cell, text=label, bg=SUBTLE, fg=MUTED,
                     font=("Helvetica", 9)).pack(anchor='w')
            tk.Label(cell, text=value, bg=SUBTLE, fg=value_fg,
                     font=("Helvetica", 11,
                             "bold" if bold_value else "normal")
                     ).pack(anchor='w')
            return cell

        # Row 1 — quantitative summary
        row1 = tk.Frame(ft_inner, bg=SUBTLE)
        row1.pack(fill='x', anchor='w')
        _kv(row1, "Σ Qty",        f"{g_qty}",                bold_value=True)
        _kv(row1, "Part weight",  f"{g_weight:.2f} kg")
        _kv(row1, "Sheet weight", f"{g_sheet_weight:.2f} kg")
        _kv(row1, "Sheets",       f"{g_sheets}",             bold_value=True)
        _kv(row1, "Nesting loss", f"{nest_loss_pct}%")

        # Row 2 — money summary, rendered only when we have a rate
        if g_cost > 0:
            row2 = tk.Frame(ft_inner, bg=SUBTLE)
            row2.pack(fill='x', anchor='w', pady=(8, 0))
            _kv(row2, "Material (incl. waste)",
                f"₹{g_mat_cost:,.0f}", bold_value=True)
            if waste_cost > 0:
                _kv(row2, "  ↳ waste",
                    f"₹{waste_cost:,.0f}", value_fg=MUTED)
            _kv(row2, "Process",  f"₹{g_proc_cost:,.0f}", bold_value=True)
            # Total — single accent
            total_cell = tk.Frame(row2, bg=SUBTLE)
            total_cell.pack(side='right', padx=0)
            tk.Label(total_cell, text="TOTAL",
                     bg=SUBTLE, fg=MUTED,
                     font=("Helvetica", 9)).pack(anchor='e')
            tk.Label(total_cell, text=f"₹{g_cost:,.0f}",
                     bg=SUBTLE, fg=ACCENT,
                     font=("Helvetica", 14, "bold")).pack(anchor='e')

        grand_qty += g_qty
        grand_weight += g_weight
        grand_sheets += g_sheets
        grand_mat_cost += g_mat_cost
        grand_proc_cost += g_proc_cost
        grand_total_cost += g_cost
        grand_sheet_weight += g_sheet_weight
        grand_part_area += g_part_area
        grand_sheet_area += g_sheet_area

        pdf_data["groups"].append({
            "material":      material,
            "rate_kg":       rate_kg,
            "rows":          pdf_rows,
            "variants":      list(variants),   # for PDF nesting thumbnails
            "qty":           g_qty,
            "weight":        g_weight,
            "sheet_weight":  g_sheet_weight,
            "sheets":        g_sheets,
            "mat_cost":      g_mat_cost,
            "proc_cost":     g_proc_cost,
            "waste_cost":    waste_cost,
            "cost":          g_cost,
            "loss_pct":      nest_loss_pct,
            "n_parts":       len(variants),
        })

    # ── Grand totals strip ──
    grand_loss = (round((1 - grand_part_area / grand_sheet_area) * 100, 1)
                  if grand_sheet_area > 0 else 0.0)
    grand_waste_cost = round(grand_mat_cost * grand_loss / 100, 2) \
                        if grand_mat_cost > 0 else 0.0
    pdf_data["grand"] = {
        "qty":          grand_qty,
        "weight":       grand_weight,
        "sheet_weight": grand_sheet_weight,
        "sheets":       grand_sheets,
        "mat_cost":     grand_mat_cost,
        "proc_cost":    grand_proc_cost,
        "waste_cost":   grand_waste_cost,
        "cost":         grand_total_cost,
        "loss_pct":     grand_loss,
    }
    # ── Grand-total footer — clean dark slate, FINAL AMOUNT on the
    # right in the single accent colour. Cost breakdown left-aligned in
    # muted text. No extra colours fighting for attention.
    foot = tk.Frame(win, bg=INK, height=96)
    foot.pack(fill='x', side='bottom'); foot.pack_propagate(False)

    foot_inner = tk.Frame(foot, bg=INK)
    foot_inner.pack(fill='both', expand=True, padx=24, pady=12)

    # Left column — quantitative + breakdown
    left_col = tk.Frame(foot_inner, bg=INK)
    left_col.pack(side='left', anchor='w')
    tk.Label(left_col, text="GRAND TOTAL",
             bg=INK, fg='white',
             font=("Helvetica", 11, "bold")).pack(anchor='w')

    qty_line = (f"Qty {grand_qty}  ·  "
                 f"Part {grand_weight:.2f} kg  ·  "
                 f"Sheet {grand_sheet_weight:.2f} kg  ·  "
                 f"{grand_sheets} sheets  ·  "
                 f"{grand_loss}% nesting loss")
    tk.Label(left_col, text=qty_line,
             bg=INK, fg='#a8a094',
             font=("Helvetica", 10)).pack(anchor='w', pady=(2, 4))

    if grand_total_cost > 0:
        cost_line = (
            f"Material ₹{grand_mat_cost:,.0f}"
            f"   ·   waste ₹{grand_waste_cost:,.0f}"
            f"   ·   process ₹{grand_proc_cost:,.0f}")
        tk.Label(left_col, text=cost_line,
                 bg=INK, fg='#a8a094',
                 font=("Helvetica", 10)).pack(anchor='w')

    # Right column — the big final amount, vertically centred
    if grand_total_cost > 0:
        right_col = tk.Frame(foot_inner, bg=INK)
        right_col.pack(side='right', anchor='e', padx=(0, 4))
        tk.Label(right_col, text="FINAL AMOUNT",
                 bg=INK, fg='#a8a094',
                 font=("Helvetica", 9, "bold")).pack(anchor='e')
        tk.Label(right_col, text=f"₹{grand_total_cost:,.0f}",
                 bg=INK, fg=ACCENT,
                 font=("Helvetica", 22, "bold")).pack(anchor='e',
                                                         pady=(2, 0))


# ═══════════════════════════════════════════════════════════════
#  PDF EXPORT
# ═══════════════════════════════════════════════════════════════

def _render_nest_png(sl: float, sw: float, pl: float, pw: float,
                       qty: int = 1, kerf: float = 2.0):
    """Render a nesting layout to an in-memory PNG and return the
    BytesIO buffer (or None on failure / oversized parts).

    Same visual style as the on-screen FAB-sheet "Nest" viewer so the
    PDF and the live tool match.
    """
    try:
        import io
        import matplotlib
        matplotlib.use("Agg")
        from matplotlib.figure import Figure
        from matplotlib.backends.backend_agg import FigureCanvasAgg
    except Exception:
        return None
    fits = (pl <= sl and pw <= sw) or (pl <= sw and pw <= sl)
    if not fits:
        return None

    fig = Figure(figsize=(3.2, 2.2), dpi=130, facecolor='white')
    ax = fig.add_subplot(111)
    n = nest(sl, sw, pl, pw, kerf=kerf, qty=qty, name="")
    pcs, waste = _draw_nest_panel(ax, sl, sw, pl, pw, kerf=kerf)
    fig.tight_layout(pad=0.4)
    buf = io.BytesIO()
    FigureCanvasAgg(fig).print_png(buf)
    buf.seek(0)
    return buf


def _write_quote_pdf(fp: str, pdf_data: dict) -> None:
    """Render the quote to a multi-page PDF using reportlab.

    Page 1: cover + per-material summary table + grand-total strip.
    Page 2+: one page per material with a parts table.
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer,
                                      Table, TableStyle, PageBreak, Image)

    doc = SimpleDocTemplate(
        fp, pagesize=landscape(A4),
        leftMargin=14 * mm, rightMargin=14 * mm,
        topMargin=14 * mm, bottomMargin=14 * mm,
        title="Quote", author="MEPL Sheet Metal Quote Tool")

    styles = getSampleStyleSheet()
    title_st = ParagraphStyle(
        "title", parent=styles["Heading1"], fontSize=20, leading=24,
        textColor=colors.HexColor("#2b211a"), spaceAfter=4)
    sub_st = ParagraphStyle(
        "sub", parent=styles["Normal"], fontSize=11, leading=14,
        textColor=colors.HexColor("#6e655a"), spaceAfter=12)
    hsec = ParagraphStyle(
        "hsec", parent=styles["Heading2"], fontSize=14, leading=18,
        textColor=colors.HexColor("#2b211a"), spaceAfter=8)
    note = ParagraphStyle(
        "note", parent=styles["Italic"], fontSize=8, leading=11,
        textColor=colors.HexColor("#64748b"))
    money = (lambda x: f"₹{x:,.0f}" if x else "")

    elements = []

    # ── Cover ──
    # ── Cover: Title (left) + STD RM RATE FORMAT table (right) ──
    rate_rows = [["Sr", "Operation", "Rate ₹/kg"]]
    # Operations only — material rates are shown per-material in the
    # group cards / summary row, not in this operations rate card.
    rate_data = [
        (1, "Punching",       STD_RATES_PER_KG.get("punching", 0)),
        (2, "Bending",        STD_RATES_PER_KG.get("bending", 0)),
        (3, "Welding & Fab.", STD_RATES_PER_KG.get("welding", 0)),
        (4, "Powder Coating", STD_RATES_PER_KG.get("powder_coating_dual", 0)),
    ]
    rate_total = sum(r[2] for r in rate_data)
    for sr, op, rt in rate_data:
        rate_rows.append([str(sr), op, f"{rt:.2f}"])
    rate_rows.append(["", "Total", f"{rate_total:.2f}"])
    rate_tbl = Table(rate_rows,
                     colWidths=[10 * mm, 35 * mm, 22 * mm])
    rate_tbl.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (-1, 0),  colors.HexColor("#f3eee5")),
        ("TEXTCOLOR",   (0, 0), (-1, 0),  colors.HexColor("#2b211a")),
        ("FONTNAME",    (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1, -1), 9),
        ("ALIGN",       (2, 1), (-1, -1), "RIGHT"),
        ("ALIGN",       (0, 0), (0, -1),  "CENTER"),
        ("BACKGROUND",  (0, -1), (-1, -1), colors.HexColor("#fef3e2")),
        ("FONTNAME",    (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BOX",         (0, 0), (-1, -1),  0.6, colors.HexColor("#a8a094")),
        ("INNERGRID",   (0, 0), (-1, -1),  0.3, colors.HexColor("#d3ccc1")),
        ("VALIGN",      (0, 0), (-1, -1),  "MIDDLE"),
    ]))
    cover_tbl = Table([[
        [Paragraph("QUOTE", title_st),
         Paragraph(f"Date: {datetime.date.today().strftime('%d %B %Y')}",
                    sub_st)],
        rate_tbl,
    ]], colWidths=[160 * mm, 70 * mm])
    cover_tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    elements.append(cover_tbl)
    elements.append(Spacer(1, 8))

    # ── Per-material summary ──
    elements.append(Paragraph("Per-Material Summary", hsec))
    summary_rows = [["Material", "Parts", "Σ Qty", "Part Wt", "Sheet Wt",
                     "Sheets", "Loss %", "Material ₹\n(incl. waste)",
                     "Process ₹", "TOTAL ₹"]]
    for g in pdf_data["groups"]:
        summary_rows.append([
            g["material"],
            str(g["n_parts"]),
            str(g["qty"]),
            f"{g['weight']:.2f}",
            f"{g.get('sheet_weight', 0):.2f}",
            str(g["sheets"]),
            f"{g['loss_pct']}%",
            money(g.get("mat_cost", 0)),
            money(g.get("proc_cost", 0)),
            money(g["cost"]),
        ])
    grand = pdf_data.get("grand") or {}
    if grand:
        summary_rows.append([
            "GRAND TOTAL", "",
            str(grand.get("qty", 0)),
            f"{grand.get('weight', 0):.2f}",
            f"{grand.get('sheet_weight', 0):.2f}",
            str(grand.get("sheets", 0)),
            f"{grand.get('loss_pct', 0)}%",
            money(grand.get("mat_cost", 0)),
            money(grand.get("proc_cost", 0)),
            money(grand.get("cost", 0)),
        ])

    summary_tbl = Table(
        summary_rows, repeatRows=1,
        colWidths=[40 * mm, 13 * mm, 14 * mm, 18 * mm, 20 * mm,
                   14 * mm, 16 * mm, 30 * mm, 22 * mm, 30 * mm])
    summary_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3a2e25")),
        ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
        ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",   (0, 0), (-1, -1), 10),
        ("ALIGN",      (1, 1), (-1, -1), "RIGHT"),
        ("ALIGN",      (0, 0), (0, -1), "LEFT"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2),
            [colors.white, colors.HexColor("#f3eee5")]),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#f3eee5")),
        ("FONTNAME",   (0, -1), (-1, -1), "Helvetica-Bold"),
        ("LINEBELOW",  (0, 0), (-1, 0), 1.0, colors.HexColor("#2b211a")),
        ("BOX",        (0, 0), (-1, -1), 0.6, colors.HexColor("#a8a094")),
        ("INNERGRID",  (0, 0), (-1, -1), 0.3, colors.HexColor("#d3ccc1")),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(summary_tbl)

    # ── Rate legend (operations only) ──
    legend = ("STD RM RATE FORMAT (₹/kg) — "
              f"Punching {STD_RATES_PER_KG['punching']:.2f} · "
              f"Bending {STD_RATES_PER_KG['bending']:.2f} · "
              f"Welding & Fab. {STD_RATES_PER_KG['welding']:.2f} · "
              f"Powder Coating {STD_RATES_PER_KG['powder_coating_dual']:.2f}")
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(legend, note))
    buf = pdf_data.get("buffer_pct", 0)
    buf_text = (f"with a {buf:g}% customer-quote buffer over the landed "
                 "mid-rate" if buf else
                 "at the landed mid-rate (no buffer applied)")
    elements.append(Paragraph(
        "Material rates from Steel Rate Card (Nashik · Apr 2026), "
        f"per material + thickness, {buf_text}. Material cost is "
        "based on FULL SHEET weight consumed (includes nesting waste / "
        "offcut); process cost is based on PART weight.",
        note))

    # ── FINAL AMOUNT banner ──
    if grand and grand.get("cost", 0) > 0:
        elements.append(Spacer(1, 14))
        final_tbl = Table([[
            Paragraph(
                f"<b>FINAL AMOUNT</b><br/>"
                f"<font size='9' color='#6b7280'>"
                f"Material (incl. waste): ₹{grand['mat_cost']:,.0f} &nbsp;"
                f"(of which nesting waste ₹{grand['waste_cost']:,.0f}) &nbsp;|&nbsp; "
                f"Process: ₹{grand['proc_cost']:,.0f}"
                f"</font>",
                ParagraphStyle("fa_l", parent=styles["Normal"],
                                fontSize=14, leading=18,
                                textColor=colors.white)),
            Paragraph(
                f"<b>₹{grand['cost']:,.0f}</b>",
                ParagraphStyle("fa_r", parent=styles["Normal"],
                                fontSize=22, leading=26, alignment=2,
                                textColor=colors.HexColor("#d97706")))
        ]], colWidths=[170 * mm, 60 * mm])
        final_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#2b211a")),
            ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 14),
            ("RIGHTPADDING",(0, 0), (-1, -1), 14),
            ("TOPPADDING",  (0, 0), (-1, -1), 12),
            ("BOTTOMPADDING",(0, 0),(-1, -1), 12),
        ]))
        elements.append(final_tbl)

    # ── One page per material ──
    for g in pdf_data["groups"]:
        elements.append(PageBreak())
        rate_lbl = (f"Material rate: ₹{g['rate_kg']:.2f}/kg"
                    if g["rate_kg"] else "Material rate: —")
        hdr = (f"{g['material']} &nbsp;&nbsp; "
               f"({g['n_parts']} part{'s' if g['n_parts']!=1 else ''}) &nbsp;&nbsp; "
               f"{rate_lbl}")
        elements.append(Paragraph(hdr, hsec))

        head = ["DRG.NO.", "DESC", "T", "L", "W", "QTY",
                "Wt (kg)", "Sheet", "Sheets", "Process",
                "Mat ₹", "Proc ₹", "Total ₹"]
        rows = [head] + [list(r) for r in g["rows"]]
        tbl = Table(
            rows, repeatRows=1,
            colWidths=[26 * mm, 36 * mm, 8 * mm, 12 * mm, 12 * mm,
                       10 * mm, 14 * mm, 26 * mm, 11 * mm,
                       30 * mm, 16 * mm, 16 * mm, 18 * mm])
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2b211a")),
            ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
            ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",   (0, 0), (-1, -1), 8.5),
            ("ALIGN",      (2, 1), (-1, -1), "RIGHT"),
            ("ALIGN",      (0, 0), (1, -1), "LEFT"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1),
                [colors.white, colors.HexColor("#f3eee5")]),
            ("BOX",        (0, 0), (-1, -1), 0.4, colors.HexColor("#a8a094")),
            ("INNERGRID",  (0, 0), (-1, -1), 0.2, colors.HexColor("#d3ccc1")),
            ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ]))
        elements.append(tbl)

        # Group footer
        elements.append(Spacer(1, 8))
        ftxt = (f"<b>Σ Qty:</b> {g['qty']} &nbsp;|&nbsp; "
                 f"<b>Part Wt:</b> {g['weight']:.2f} kg &nbsp;|&nbsp; "
                 f"<b>Sheet Wt:</b> {g.get('sheet_weight', 0):.2f} kg &nbsp;|&nbsp; "
                 f"<b>Sheets:</b> {g['sheets']} &nbsp;|&nbsp; "
                 f"<b>Nesting loss:</b> {g['loss_pct']}% "
                 f"(₹{g.get('waste_cost', 0):,.0f} of waste)")
        elements.append(Paragraph(ftxt, ParagraphStyle(
            "ft", parent=styles["Normal"], fontSize=10, leading=13,
            textColor=colors.HexColor("#6e655a"),
            backColor=colors.HexColor("#f3eee5"),
            borderPadding=6, leftIndent=2, spaceBefore=4)))
        if g.get("cost"):
            ctxt = (f"<b>Material (incl. waste):</b> ₹{g.get('mat_cost',0):,.0f} &nbsp;|&nbsp; "
                    f"<b>Process:</b> ₹{g.get('proc_cost',0):,.0f} &nbsp;|&nbsp; "
                    f"<b>TOTAL:</b> <font color='#2b211a' size='12'>"
                    f"₹{g['cost']:,.0f}</font>")
            elements.append(Paragraph(ctxt, ParagraphStyle(
                "ct", parent=styles["Normal"], fontSize=10, leading=14,
                textColor=colors.HexColor("#6e655a"),
                backColor=colors.HexColor("#fef3e2"),
                borderPadding=6, leftIndent=2, spaceBefore=2)))

        # ── Nesting layouts (one thumbnail per distinct part dimension) ──
        variants = g.get("variants") or []
        seen_dims: set = set()
        thumb_cells = []
        for v in variants:
            if not (v.length and v.width and v.thickness):
                continue
            dims = STANDARD_SHEETS.get(v.sheet_name) or (1220, 2440)
            sl, sw = dims
            key = (round(v.length, 1), round(v.width, 1),
                    round(sl, 1), round(sw, 1))
            if key in seen_dims:
                continue
            seen_dims.add(key)
            png = _render_nest_png(sl, sw, v.length, v.width, qty=v.qty)
            if png is None:
                continue
            cap = (f"<b>{v.name}</b><br/>"
                    f"<font size='8' color='#64748b'>"
                    f"{int(v.length)} × {int(v.width)} mm on "
                    f"{int(sl)} × {int(sw)} mm</font>")
            thumb_cells.append([
                Image(png, width=68 * mm, height=46 * mm),
                Paragraph(cap, ParagraphStyle(
                    "tc", parent=styles["Normal"], fontSize=9, leading=11,
                    alignment=1)),
            ])

        if thumb_cells:
            elements.append(Spacer(1, 10))
            elements.append(Paragraph(
                "Nesting Layouts", ParagraphStyle(
                    "ns", parent=styles["Heading3"], fontSize=12,
                    leading=15,
                    textColor=colors.HexColor("#2b211a"),
                    spaceAfter=4)))
            # 3 thumbnails per row.
            grid_rows = []
            for i in range(0, len(thumb_cells), 3):
                row_imgs = [c[0] for c in thumb_cells[i:i + 3]]
                row_caps = [c[1] for c in thumb_cells[i:i + 3]]
                while len(row_imgs) < 3:
                    row_imgs.append("")
                    row_caps.append("")
                grid_rows.append(row_imgs)
                grid_rows.append(row_caps)
            grid = Table(grid_rows,
                          colWidths=[75 * mm] * 3)
            grid.setStyle(TableStyle([
                ("VALIGN",      (0, 0), (-1, -1), "TOP"),
                ("ALIGN",       (0, 0), (-1, -1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING",(0, 0), (-1, -1), 4),
                ("TOPPADDING",  (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING",(0, 0),(-1, -1), 2),
            ]))
            elements.append(grid)

    doc.build(elements)
