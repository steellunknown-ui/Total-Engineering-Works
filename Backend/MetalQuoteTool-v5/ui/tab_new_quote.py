"""Tab 1 — New Quote. Port of the v4 single-quote flow with SQLite save added."""
import os
import datetime
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

from ui.theme import C, F, FONT, _btn
from ui.widgets.card import make_card
from ui.widgets.field import make_field, make_dropdown
from data.constants import MATERIALS, THICKNESSES, SURFACES, STANDARD_SHEETS, SURFACES_PER_KG
from core.calc import wt, get_band, rate_at
from core.nesting import nest
from core.quote_engine import gen_quote
from core.cad_reader import (
    HAS_EZDXF, HAS_OCC, read_dxf, read_step_iges,
    render_dxf_2d, render_3d_cad, show_nesting_visual,
)
from core.excel_reader import HAS_OPENPYXL, read_excel, lookup_qty, normalize_drg
from core.export import export_pdf, export_xlsx


class NewQuoteTab(tk.Frame):
    def __init__(self, parent, app):
        super().__init__(parent, bg=C['bg'])
        self.app = app
        self.last_q = None
        self.dxf_path = None
        self._loaded_quote_id = None
        # Excel BOM state — populated by _bom_import_excel(); keys are
        # normalize_drg()-ed strings, values are int quantities.
        self.bom_qty_map: dict[str, int] = {}
        self.bom_path: str | None = None
        self.current_drg_no: str = ""

        pw = tk.PanedWindow(self, orient='horizontal', bg=C['bg'],
                            sashwidth=4, sashrelief='flat')
        pw.pack(fill='both', expand=True, padx=10, pady=10)

        lf = tk.Frame(pw, bg=C['bg']); pw.add(lf, width=380)
        cv = tk.Canvas(lf, bg=C['bg'], highlightthickness=0)
        vs = ttk.Scrollbar(lf, orient='vertical', command=cv.yview)
        self.inp = tk.Frame(cv, bg=C['bg'])
        self.inp.bind('<Configure>', lambda e: cv.configure(scrollregion=cv.bbox('all')))
        cv.create_window((0, 0), window=self.inp, anchor='nw')
        cv.configure(yscrollcommand=vs.set)
        vs.pack(side='right', fill='y'); cv.pack(side='left', fill='both', expand=True)
        self._bind_mousewheel(cv)

        rf = tk.Frame(pw, bg=C['bg']); pw.add(rf, width=880)
        self._build_inputs()
        self._build_output(rf)
        # Initial weight readout (after all input widgets exist)
        self._update_weight()

    # ── input parsers ──
    def _f(self, v, d=0.0):
        try: return float(v.get())
        except: return d

    def _i(self, v, d=0):
        try: return int(float(v.get()))
        except: return d

    # ── mouse-wheel routing (cursor-aware, cross-platform) ──
    def _bind_mousewheel(self, canvas):
        """Route wheel events to `canvas` only while cursor is inside it."""
        def on_wheel(e):
            # Linux/X11 uses Button-4 / Button-5
            if getattr(e, 'num', 0) == 4:
                canvas.yview_scroll(-3, 'units'); return
            if getattr(e, 'num', 0) == 5:
                canvas.yview_scroll(3, 'units'); return
            # macOS: delta is small (±1, ±3). Windows: multiples of 120.
            delta = e.delta
            if delta == 0:
                return
            step = -1 if delta > 0 else 1
            if abs(delta) >= 120:
                mag = max(1, abs(int(delta / 120)))
            else:
                mag = max(1, abs(int(delta)))
            canvas.yview_scroll(step * mag, 'units')

        def on_enter(_e):
            canvas.bind_all('<MouseWheel>', on_wheel)
            canvas.bind_all('<Button-4>', on_wheel)
            canvas.bind_all('<Button-5>', on_wheel)

        def on_leave(_e):
            canvas.unbind_all('<MouseWheel>')
            canvas.unbind_all('<Button-4>')
            canvas.unbind_all('<Button-5>')

        canvas.bind('<Enter>', on_enter)
        canvas.bind('<Leave>', on_leave)

    # ── live weight readout ──
    def _update_weight(self, *_):
        """Recompute per-piece and lot weight from current inputs.
        Formula: kg/pc = (L/1000) × (W/1000) × (T/1000) × density
        """
        if not hasattr(self, 'weight_lbl'):
            return
        try:
            mat = self.v_mat.get()
            t = float(self.v_thick.get())
            pl = float(self.v_len.get())
            pw = float(self.v_wid.get())
            qty = int(float(self.v_qty.get()))
            w_pc = wt(mat, pl, pw, t)
            w_total = round(w_pc * qty, 2) if qty > 0 else 0
            self.weight_lbl.config(
                text=f"Weight:  {w_pc} kg/pc   ·   {w_total} kg total  ({qty} pcs)",
                fg=C['teal'])
        except (ValueError, AttributeError, TypeError):
            self.weight_lbl.config(text="Weight:  —", fg=C['text2'])

    # ── INPUTS ──
    def _build_inputs(self):
        # CAD Import
        b = make_card(self.inp, "Import CAD File")
        bf = tk.Frame(b, bg=C['card']); bf.pack(fill='x', pady=(0, 4))
        _btn(bf, "Import DXF", C['btn_blue'], 'white', self._cad_import_dxf,
             size=9, px=10, py=4, hover=C['btn_blue_h']).pack(side='left', padx=2)
        _btn(bf, "Import PDF", C['btn_blue'], 'white', self._cad_import_pdf,
             size=9, px=10, py=4, hover=C['btn_blue_h']).pack(side='left', padx=2)
        _btn(bf, "Import Excel", C['btn_blue'], 'white', self._bom_import_excel,
             size=9, px=10, py=4, hover=C['btn_blue_h']).pack(side='left', padx=2)
        _btn(bf, "STEP/IGES", C['btn_blue'], 'white', self._cad_import_3d,
             size=9, px=10, py=4, hover=C['btn_blue_h']).pack(side='left', padx=2)
        _btn(bf, "View", '#6e655a', 'white', self._cad_view,
             size=9, px=8, py=4, hover='#64748b').pack(side='left', padx=2)
        _btn(bf, "Clear", '#6e655a', 'white', self._clear_cad,
             size=9, px=8, py=4, hover='#64748b').pack(side='left', padx=2)
        self.file_lbl = tk.Label(b, text="No file loaded", font=FONT['file_loaded'],
                                  bg=C['card'], fg=C['text2'])
        self.file_lbl.pack(anchor='w', pady=(2, 0))
        # BOM status — shows which Excel BOM (if any) is currently loaded and
        # whether the active drawing was matched against it.
        self.bom_lbl = tk.Label(b, text="No BOM loaded", font=FONT['file_loaded'],
                                bg=C['card'], fg=C['text2'])
        self.bom_lbl.pack(anchor='w', pady=(0, 0))
        self.detect_lbl = tk.Label(b, text="", font=FONT['detect'],
                                    bg=C['card'], fg=C['text2'], wraplength=320, justify='left')
        self.detect_lbl.pack(anchor='w')

        # Material & Rate — all three fields typed manually by the operator.
        b = make_card(self.inp, "Material & Rate")
        self.v_mat = make_field(b, "Material:", 0, "", 18)
        self.v_thick = make_field(b, "Thickness:", 1, "", unit="mm")
        self.v_rate = make_field(b, "Rate:", 2, "", unit="₹/kg")
        # Clear red "missing" highlight as soon as the user types.
        for var in (self.v_mat, self.v_thick):
            var.trace_add('write', lambda *_, v=var: self._reset_missing(v))

        # Customer (NEW)
        b = make_card(self.inp, "Customer")
        self.v_customer = make_field(b, "Name:", 0, "", 22)
        self.v_contact = make_field(b, "Contact:", 1, "", 22)
        self.v_cnotes = make_field(b, "Notes:", 2, "", 22)

        # Part Info
        b = make_card(self.inp, "Part Information")
        self.v_name = make_field(b, "Part Name:", 0, "New Part", 18)
        self.v_qty = make_field(b, "Quantity:", 1, "100")
        self.v_len = make_field(b, "Length:", 2, "500", unit="mm")
        self.v_wid = make_field(b, "Width:", 3, "300", unit="mm")
        # Live weight readout — auto-updates when any dim/qty/material/thickness changes
        self.weight_lbl = tk.Label(b, text="Weight:  —",
                                   font=(F['body'], 10, 'bold'),
                                   bg=C['card'], fg=C['teal'], anchor='w')
        self.weight_lbl.grid(row=4, column=0, columnspan=2, sticky='w', padx=4, pady=(6, 2))
        # Recompute weight on any input change (uses trace so it fires for both
        # keyboard edits and programmatic .set() calls from CAD import).
        for v in (self.v_qty, self.v_len, self.v_wid,
                  self.v_thick, self.v_mat):
            v.trace_add('write', self._update_weight)

        # Operations
        b = make_card(self.inp, "Operations")
        self.v_cut, _ = make_dropdown(b, "Cut Method:", 0,
                                      ["laser", "plasma", "waterjet", "shearing"], "laser")
        self.v_cperi = make_field(b, "Cut Perimeter:", 1, "0", unit="mm")
        self.v_icut = make_field(b, "Internal Cuts:", 2, "0", unit="mm")
        self.v_blen = make_field(b, "Bend Length:", 3, "0", unit="mm")
        self.v_bends = make_field(b, "Bends:", 4, "0")
        self.v_holes = make_field(b, "Holes:", 5, "0")
        self.v_hdia = make_field(b, "Hole Dia:", 6, "10", unit="mm")
        self.v_wtype, _ = make_dropdown(b, "Weld Type:", 7,
                                        ["mig", "tig", "arc", "spot"], "mig")
        self.v_wlen = make_field(b, "Weld Length:", 8, "0", unit="mm")
        self.v_spots = make_field(b, "Spot Welds:", 9, "0")

        # MEPL Standard Process Rates — tick to apply flat ₹/kg (editable in Settings).
        b = make_card(self.inp, "Standard Processes (MEPL, ₹/kg)")
        from data.constants import STD_RATES_PER_KG as _SRK
        self.v_ap_punch = tk.BooleanVar(value=False)
        self.v_ap_bend  = tk.BooleanVar(value=False)
        self.v_ap_weld  = tk.BooleanVar(value=False)
        self.v_ap_pc    = tk.BooleanVar(value=False)
        for row, (var, label, key) in enumerate([
            (self.v_ap_punch, "Punching", "punching"),
            (self.v_ap_bend,  "Bending", "bending"),
            (self.v_ap_weld,  "Welding & Fab.", "welding"),
            (self.v_ap_pc,    "Powder Coating (Dual Shade)", "powder_coating_dual"),
        ]):
            tk.Checkbutton(b, text=f"{label}  —  ₹{_SRK.get(key,0):.2f}/kg",
                           variable=var, bg=C['card'], fg=C['text'],
                           font=FONT['label'], anchor='w',
                           activebackground=C['card'], selectcolor='white'
                           ).grid(row=row, column=0, columnspan=2, sticky='w', padx=4, pady=2)

        # Hardware & Packaging (lot-level extras — entered as ₹ lump sums)
        b = make_card(self.inp, "Hardware & Packaging")
        self.v_hw = make_field(b, "Hardware / BO:", 0, "0", unit="₹/lot")
        self.v_wrap = make_field(b, "Stretch Wrap:", 1, "0", unit="₹/lot")
        self.v_pack = make_field(b, "Packaging:", 2, "0", unit="₹/lot")
        tk.Label(b, text="Entered as total ₹ for the whole lot; split per piece internally",
                 font=FONT['body_xxs'], bg=C['card'], fg=C['text2']).grid(
            row=3, column=0, columnspan=2, sticky='w', padx=4)

        # Finish
        b = make_card(self.inp, "Finish")
        surf_opts = list(SURFACES.keys()) + list(SURFACES_PER_KG.keys())
        self.v_surf, _ = make_dropdown(b, "Surface:", 0, surf_opts, "None")

        # Margins
        b = make_card(self.inp, "Margins")
        self.v_oh = make_field(b, "Overhead %:", 0, "15")
        self.v_pr = make_field(b, "Profit %:", 1, "10")

        # Action bar
        bf = tk.Frame(self.inp, bg=C['bg']); bf.pack(fill='x', padx=2, pady=6)
        _btn(bf, "Clear All", '#6e655a', 'white', self._clear,
             size=9, px=12, py=5, hover='#64748b').pack(side='left', padx=2)
        _btn(bf, "Generate Quote", C['teal'], 'white', self._generate,
             size=10, px=16, py=6, hover=C['teal_h']).pack(side='right', padx=2)

    # ── OUTPUT ──
    def _build_output(self, parent):
        cv = tk.Canvas(parent, bg=C['bg'], highlightthickness=0)
        vs = ttk.Scrollbar(parent, orient='vertical', command=cv.yview)
        self.out = tk.Frame(cv, bg=C['bg'])
        self.out.bind('<Configure>', lambda e: cv.configure(scrollregion=cv.bbox('all')))
        cv.create_window((0, 0), window=self.out, anchor='nw')
        cv.configure(yscrollcommand=vs.set)
        vs.pack(side='right', fill='y'); cv.pack(side='left', fill='both', expand=True)
        self._bind_mousewheel(cv)

        hdr_frame = tk.Frame(self.out, bg=C['card']); hdr_frame.pack(fill='x', padx=4, pady=4)
        hdr_top = tk.Frame(hdr_frame, bg=C['navy'], height=38)
        hdr_top.pack(fill='x'); hdr_top.pack_propagate(False)
        tk.Label(hdr_top, text="  MEPL QUOTATION REPORT", font=FONT['h2'],
                 bg=C['navy'], fg='#ffffff').pack(side='left', padx=10)
        self.rpt_quote_no = tk.Label(hdr_top, text="", font=FONT['status'],
                                     bg=C['navy'], fg=C['teal'])
        self.rpt_quote_no.pack(side='left', padx=12)
        self.rpt_date = tk.Label(hdr_top, text="", font=FONT['status'],
                                  bg=C['navy'], fg='#a8a094')
        self.rpt_date.pack(side='right', padx=12)

        info_frame = tk.Frame(hdr_frame, bg=C['card'], padx=14, pady=8)
        info_frame.pack(fill='x')
        self.rpt_part = tk.StringVar(value="—")
        self.rpt_material = tk.StringVar(value="—")
        self.rpt_dims = tk.StringVar(value="—")
        self.rpt_flat = tk.StringVar(value="")
        for label, var in [("Part:", self.rpt_part), ("Material:", self.rpt_material),
                           ("Size:", self.rpt_dims)]:
            row = tk.Frame(info_frame, bg=C['card']); row.pack(fill='x', pady=1)
            tk.Label(row, text=label, font=FONT['info_label'],
                     bg=C['card'], fg=C['text2'], width=8, anchor='w').pack(side='left')
            tk.Label(row, textvariable=var, font=FONT['info_value'],
                     bg=C['card'], fg=C['text']).pack(side='left', padx=4)
        tk.Label(info_frame, textvariable=self.rpt_flat,
                 font=FONT['flat_hint'], bg=C['card'], fg=C['teal']).pack(anchor='w')

        # KPI strip
        kpi_frame = tk.Frame(self.out, bg=C['bg']); kpi_frame.pack(fill='x', padx=4, pady=4)
        self.d_wt = tk.StringVar(value="—")
        self.d_rate = tk.StringVar(value="—")
        self.d_nest = tk.StringVar(value="—")
        self.d_total = tk.StringVar(value="—")
        for label, var, val_fg, bar_col in [
            ("Weight", self.d_wt, C['text'], C['teal']),
            ("Rate/pc", self.d_rate, C['text'], C['teal']),
            ("Nesting", self.d_nest, C['teal'], C['teal']),
            ("Total", self.d_total, C['navy'], C['teal']),
        ]:
            kc = tk.Frame(kpi_frame, bg=C['card'], padx=14, pady=10,
                          highlightbackground=C['border'], highlightthickness=1)
            kc.pack(side='left', fill='x', expand=True, padx=3)
            tk.Label(kc, text=label, font=FONT['badge_label'],
                     bg=C['card'], fg=C['text2']).pack(anchor='w')
            tk.Label(kc, textvariable=var, font=(F['family'], 16, 'bold'),
                     bg=C['card'], fg=val_fg).pack(anchor='w', pady=(2, 4))
            tk.Frame(kc, bg=bar_col, height=3).pack(fill='x')

        # Line items
        tbl_frame = tk.Frame(self.out, bg=C['card']); tbl_frame.pack(fill='x', padx=4, pady=4)
        tbl_hdr = tk.Frame(tbl_frame, bg=C['navy'], height=32)
        tbl_hdr.pack(fill='x'); tbl_hdr.pack_propagate(False)
        tk.Label(tbl_hdr, text="  Cost Breakdown", font=FONT['section'],
                 bg=C['navy'], fg='#ffffff').pack(side='left', padx=8)
        tf = tk.Frame(tbl_frame, bg=C['card']); tf.pack(fill='both', expand=True, padx=4, pady=4)
        ys = ttk.Scrollbar(tf, orient='vertical')
        cols = ('Description', 'Qty', 'Unit', 'Rate (₹)', 'Amount (₹)')
        self.tree = ttk.Treeview(tf, columns=cols, show='headings',
                                  yscrollcommand=ys.set, style='Q.Treeview', height=10)
        ys.config(command=self.tree.yview)
        widths = {'Description': 260, 'Qty': 55, 'Unit': 55, 'Rate (₹)': 90, 'Amount (₹)': 100}
        for col in cols:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=widths[col], minwidth=40,
                             anchor='e' if col != 'Description' else 'w')
        self.tree.tag_configure('odd', background='#ffffff')
        self.tree.tag_configure('even', background=C['table_alt'])
        self.tree.tag_configure('sub', background=C['sect_bg'], font=FONT['tbl_body'])
        self.tree.tag_configure('total', background=C['navy'], foreground='#ffffff',
                                font=FONT['tbl_bold'])
        self.tree.tag_configure('grand', background=C['teal'], foreground='#ffffff',
                                font=FONT['tbl_grand'])
        ys.pack(side='right', fill='y'); self.tree.pack(fill='both', expand=True)

        # Nesting info
        nest_frame = tk.Frame(self.out, bg=C['card']); nest_frame.pack(fill='x', padx=4, pady=4)
        nest_hdr = tk.Frame(nest_frame, bg=C['navy'], height=32)
        nest_hdr.pack(fill='x'); nest_hdr.pack_propagate(False)
        tk.Label(nest_hdr, text="  Nesting Analysis", font=FONT['section'],
                 bg=C['navy'], fg='#ffffff').pack(side='left', padx=8)
        self.nest_info = tk.Label(nest_frame, text="Generate a quote to see nesting results",
                                   font=FONT['body'], bg=C['card'], fg=C['text2'],
                                   padx=14, pady=10, justify='left')
        self.nest_info.pack(fill='x')

        # Action bar
        bar = tk.Frame(self.out, bg='#334155', padx=12, pady=8)
        bar.pack(fill='x', padx=4, pady=(4, 4))
        sf = tk.Frame(bar, bg='#334155'); sf.pack(side='left')
        tk.Label(sf, text="Sheet:", font=FONT['label'], bg='#334155',
                 fg='#a8a094').pack(side='left', padx=(0, 6))
        self.v_sheet = tk.StringVar(value="Auto-Best")
        self.cb_sheet = ttk.Combobox(sf, textvariable=self.v_sheet,
            values=["Auto-Best"] + list(STANDARD_SHEETS.keys()), width=24, state='readonly')
        self.cb_sheet.pack(side='left')
        tk.Label(sf, text="  Kerf:", font=FONT['label'], bg='#334155',
                 fg='#a8a094').pack(side='left', padx=(12, 4))
        self.v_kerf = tk.StringVar(value="2")
        tk.Entry(sf, textvariable=self.v_kerf, width=4, font=FONT['input'],
                 relief='solid', bd=1, bg='#ffffff', fg='#2b211a',
                 insertbackground='#2b211a').pack(side='left')
        tk.Label(sf, text="mm", font=FONT['label'], bg='#334155',
                 fg='#a8a094').pack(side='left', padx=2)

        _btn(bar, "Nesting Layout", C['teal'], 'white', self._nest_viz,
             size=9, px=12, py=4, hover=C['teal_h']).pack(side='right', padx=3)
        _btn(bar, "Save to DB", C['success'], 'white', self._save_to_db,
             size=9, px=12, py=4, hover=C['success_hover']).pack(side='right', padx=3)
        _btn(bar, "Export Excel", C['btn_blue'], 'white', self._xlsx,
             size=9, px=12, py=4, hover=C['btn_blue_h']).pack(side='right', padx=3)
        _btn(bar, "Export PDF", C['btn_blue'], 'white', self._pdf,
             size=9, px=12, py=4, hover=C['btn_blue_h']).pack(side='right', padx=3)

    # ── generate ──
    def _generate(self):
        try:
            sn = self.v_sheet.get()
            q = gen_quote(
                name=self.v_name.get(), mat=self.v_mat.get(),
                t=self._f(self.v_thick, 2), pl=self._f(self.v_len, 500), pw=self._f(self.v_wid, 300),
                qty=self._i(self.v_qty, 1), slider=50,
                manual_rate=self._f(self.v_rate, 0),
                cut_m=self.v_cut.get(), cut_p=self._f(self.v_cperi),
                int_c=self._f(self.v_icut),
                n_bends=self._i(self.v_bends), b_len=self._f(self.v_blen),
                n_holes=self._i(self.v_holes), h_dia=self._f(self.v_hdia, 10),
                w_type=self.v_wtype.get(), w_len=self._f(self.v_wlen),
                n_spots=self._i(self.v_spots),
                surface=self.v_surf.get(), oh_pct=self._f(self.v_oh, 15),
                pr_pct=self._f(self.v_pr, 20),
                sheet_n=None if sn == "Auto-Best" else sn,
                kerf=self._f(self.v_kerf, 2), box_h=0,
                hardware=self._f(self.v_hw, 0),
                stretch_wrap=self._f(self.v_wrap, 0),
                packaging=self._f(self.v_pack, 0),
                apply_punch=self.v_ap_punch.get(),
                apply_bend=self.v_ap_bend.get(),
                apply_weld=self.v_ap_weld.get(),
                apply_pc_dual=self.v_ap_pc.get(),
            )
            self.last_q = q
            self._loaded_quote_id = None

            self.rpt_quote_no.config(text="(unsaved)")
            self.rpt_date.config(text=datetime.datetime.now().strftime('%d %b %Y, %I:%M %p'))
            self.rpt_part.set(f"{q.name}  ×  {q.qty} pcs")
            self.rpt_material.set(f"{q.mat}  {q.t}mm  @  ₹{q.rate_kg}/kg")
            self.rpt_dims.set(f"{q.pl} × {q.pw} mm  |  Weight: {q.weight} kg/pc")
            self.rpt_flat.set(q.flat_info if q.flat_info else "")

            for item in self.tree.get_children():
                self.tree.delete(item)
            for i, l in enumerate(q.lines):
                tag = 'even' if i % 2 == 0 else 'odd'
                self.tree.insert('', 'end', values=(l.desc, f"{l.qty}", l.unit,
                    f"₹{l.rate:,.2f}", f"₹{l.amt:,.2f}"), tags=(tag,))
            self.tree.insert('', 'end', values=("Subtotal", "", "", "", f"₹{q.sub:,.2f}"), tags=('sub',))
            self.tree.insert('', 'end', values=(f"Overhead ({q.overhead_pct}%)", "", "", "", f"₹{q.overhead:,.2f}"), tags=('sub',))
            self.tree.insert('', 'end', values=(f"Profit ({q.profit_pct}%)", "", "", "", f"₹{q.profit:,.2f}"), tags=('sub',))
            self.tree.insert('', 'end', values=("RATE PER PIECE", "", "", "", f"₹{q.per_pc:,.2f}"), tags=('total',))
            self.tree.insert('', 'end', values=(f"TOTAL  ({q.qty} pieces)", "", "", "", f"₹{q.total:,.2f}"), tags=('grand',))

            self.d_wt.set(f"{q.weight} kg")
            self.d_rate.set(f"₹ {q.per_pc:,.0f}")
            self.d_total.set(f"₹{q.total:,.0f}")

            if q.n:
                n = q.n
                self.d_nest.set(f"{n.best} pcs/sht")
                total_mat = q.sheet_cost * n.sheets if q.sheet_cost else 0
                self.nest_info.config(
                    text=f"Best fit: {n.best} pcs/sheet ({n.orient}) on {n.name}\n"
                         f"Normal: {n.normal}  |  Rotated: {n.rotated}  |  Mixed: {n.mixed}\n"
                         f"Utilization: {n.util}%  |  Waste: {n.waste}%\n"
                         f"Sheets needed: {n.sheets}  |  "
                         f"Material cost: ₹{q.sheet_cost:,.0f} × {n.sheets} = ₹{total_mat:,.0f}",
                    fg=C['text'])

            self.app.status.set_message(f"Generated quote: ₹{q.total:,.0f}")
        except Exception as e:
            messagebox.showerror("Error", str(e))
            import traceback; traceback.print_exc()

    def _save_to_db(self):
        if not self.last_q:
            messagebox.showinfo("", "Generate a quote first"); return
        try:
            qid = self.app.db.save_quote(
                self.last_q,
                customer=self.v_customer.get(),
                cad_file=self.dxf_path or "",
                cut_method=self.v_cut.get(),
                weld_type=self.v_wtype.get(),
                box_height_mm=0,
            )
            row = self.app.db.conn.execute(
                "SELECT quote_no FROM quotes WHERE id = ?", (qid,)).fetchone()
            self.rpt_quote_no.config(text=row["quote_no"])
            self._loaded_quote_id = qid
            self.app.refresh_header_stats()
            ts = datetime.datetime.now().strftime('%H:%M')
            self.app.status.set_message(f"Saved quote {row['quote_no']} at {ts}")
        except Exception as e:
            messagebox.showerror("DB Error", str(e))

    # ── CAD ──
    def _apply_cad_data(self, d, fp):
        self.dxf_path = fp
        self.v_len.set(str(d["length"]))
        self.v_wid.set(str(d["width"]))
        if d.get("thickness_3d", 0) > 0:
            self.v_thick.set(str(d["thickness_3d"]))
        if d.get("outer_perimeter", 0) > 0:
            self.v_cperi.set(str(d["outer_perimeter"]))
        elif d.get("cut", 0) > 0:
            self.v_cperi.set(str(d["cut"]))
        if d.get("internal_cuts", 0) > 0:
            self.v_icut.set(str(d["internal_cuts"]))
        try:
            t = float(self.v_thick.get())
            self.v_cut.set("laser" if t <= 6.0 else "plasma")
        except:
            pass
        if d.get("holes", 0) > 0:
            self.v_holes.set(str(d["holes"]))
            self.v_hdia.set(str(d["hole_dia"]))
        if d.get("n_bends", 0) > 0:
            self.v_bends.set(str(d["n_bends"]))
            self.v_blen.set(str(d.get("bend_length", 0) or d["width"]))
        if d.get("weld_length", 0) > 0:
            self.v_wlen.set(str(d["weld_length"]))
        src = d.get("source", "CAD")
        self.file_lbl.config(
            text=f"{os.path.basename(fp)} ({src}) — {d['length']}×{d['width']}mm",
            fg=C['teal'])
        parts = [f"Cut: {d.get('outer_perimeter', 0)}mm outer"]
        if d.get("internal_cuts", 0) > 0:
            parts.append(f"+ {d['internal_cuts']}mm internal")
        if d.get("holes", 0) > 0:
            parts.append(f"| {d['holes']} holes (Ø{d['hole_dia']})")
        if d.get("n_bends", 0) > 0:
            angles_str = ", ".join(f"{a}°" for a in d.get("bend_angles", [])[:4])
            parts.append(f"| {d['n_bends']} bends ({angles_str})")
        if d.get("weld_length", 0) > 0:
            parts.append(f"| Weld: {d['weld_length']}mm")
        if d.get("thickness_3d", 0) > 0:
            parts.append(f"| t={d['thickness_3d']}mm")
        self.detect_lbl.config(text="Detected: " + " ".join(parts))
        self.app.status.set_message(f"Loaded {os.path.basename(fp)}")

    def _cad_import_dxf(self):
        if not HAS_EZDXF:
            messagebox.showwarning("Missing", "pip install ezdxf"); return
        fp = filedialog.askopenfilename(title="Open DXF File",
            filetypes=[("DXF Files", "*.dxf"), ("All Files", "*.*")])
        if not fp: return
        try:
            d = read_dxf(fp)
            if d:
                self._apply_cad_data(d, fp)
                # DXF gives us length & width → also try to fill quantity
                # from the Excel BOM if one is loaded.
                self._apply_qty_from_bom(d.get("drg_no", ""))
            else: messagebox.showwarning("Empty", "No geometry found.")
        except Exception as e:
            messagebox.showerror("DXF Error", str(e))

    # ── Excel BOM ────────────────────────────────────────────────────────
    def _bom_import_excel(self):
        """Load an SAP-export / BOM Excel.  Builds the {drg_no → qty} map
        used to auto-fill the Quantity field after a matching DXF or PDF is
        imported.  Also retro-fills qty for whichever drawing is currently
        loaded, if a match exists."""
        if not HAS_OPENPYXL:
            messagebox.showwarning("openpyxl Missing",
                "Install openpyxl to enable Excel BOM upload:\n\n"
                "    pip install openpyxl\n\nThen restart the app.")
            return
        fp = filedialog.askopenfilename(title="Open Excel BOM / SAP Export",
            filetypes=[("Excel", "*.xlsx *.xlsm"), ("All Files", "*.*")])
        if not fp: return
        try:
            d = read_excel(fp)
        except Exception as e:
            messagebox.showerror("Excel Error", str(e)); return

        if d["missing"]:
            messagebox.showwarning("Excel BOM — No usable data",
                "\n".join(d["missing"]))
            self.bom_qty_map = {}
            self.bom_path = None
            self.bom_lbl.config(text="No BOM loaded", fg=C['text2'])
            return

        self.bom_qty_map = d["drg_qty"]
        self.bom_path = fp
        self.bom_lbl.config(
            text=(f"BOM: {os.path.basename(fp)}  ·  "
                  f"{d['n_matches']} drawings  ·  "
                  f"cols: {d['drg_col']} / {d['qty_col']}"),
            fg=C['teal'])
        self.app.status.set_message(
            f"Loaded BOM: {os.path.basename(fp)} ({d['n_matches']} entries)")

        # If the user already loaded a DXF/PDF whose drawing-no we know,
        # back-fill its quantity now.
        if self.current_drg_no:
            self._apply_qty_from_bom(self.current_drg_no, verbose=True)

    def _apply_qty_from_bom(self, drg_no: str, verbose: bool = False) -> None:
        """If `drg_no` is found in the loaded BOM, set the Quantity field
        and update the BOM status label.

        Called from both `_apply_cad_data` (DXF flow) and the PDF import
        flow whenever a drawing number has been extracted."""
        if not drg_no:
            if verbose:
                messagebox.showinfo("Quantity Lookup",
                    "No drawing number could be detected on this file — "
                    "Quantity must be entered manually.")
            return

        # Remember the drg_no even if there's no BOM yet — that way a
        # later "Import Excel" can back-fill the qty.
        self.current_drg_no = drg_no

        if not self.bom_qty_map:
            return                              # no BOM yet — nothing to do

        qty = lookup_qty(self.bom_qty_map, drg_no)
        if qty is None:
            self.bom_lbl.config(
                text=(f"BOM: {os.path.basename(self.bom_path or '')}  ·  "
                      f"Drg '{drg_no}' NOT in BOM"),
                fg='#dc2626')
            if verbose:
                messagebox.showinfo("Quantity Lookup",
                    f"Drawing '{drg_no}' was not found in the loaded BOM.\n"
                    "Quantity left unchanged.")
            return

        # Match!  Set the field and visually confirm.
        self.v_qty.set(str(qty))
        self._reset_missing(self.v_qty)
        self._update_weight()
        self.bom_lbl.config(
            text=(f"BOM: {os.path.basename(self.bom_path or '')}  ·  "
                  f"Drg '{drg_no}' → Qty {qty}"),
            fg=C['teal'])
        self.app.status.set_message(
            f"Qty {qty} auto-filled for drawing {drg_no}")

    def _mark_missing(self, var):
        """Clear the field and paint it red to signal the operator must fill it."""
        var.set("")
        e = getattr(var, '_entry', None)
        if e is not None:
            e.config(bg='#ffe4e4', highlightcolor='#dc2626',
                     highlightbackground='#dc2626')

    def _reset_missing(self, var):
        """Restore default styling once the user starts editing."""
        e = getattr(var, '_entry', None)
        if e is not None:
            e.config(bg=C['input_bg'], highlightcolor=C['teal'],
                     highlightbackground='#d3ccc1')

    def _cad_import_pdf(self):
        from core.pdf_reader import HAS_PDF, HAS_OCR, OCR_BACKEND, read_pdf
        if not HAS_PDF:
            messagebox.showwarning("PDF Library Missing",
                "Install a PDF parser:\n\n    pip install pymupdf\n\n"
                "Then restart the app."); return
        fp = filedialog.askopenfilename(title="Open PDF File",
            filetypes=[("PDF Files", "*.pdf"), ("All Files", "*.*")])
        if not fp: return
        hint = f" (OCR via {OCR_BACKEND}, ~3–30s)" if HAS_OCR else ""
        self.app.status.set_message(f"Parsing PDF{hint}…")
        self.update_idletasks()
        try:
            d = read_pdf(fp)
        except Exception as e:
            messagebox.showerror("PDF Error", str(e)); return

        filled = []
        if d["material"]:
            self.v_mat.set(d["material"])
            self._reset_missing(self.v_mat)
            filled.append(f"Material: {d['material']}")
        else:
            self._mark_missing(self.v_mat)

        if d["thickness"] is not None:
            self.v_thick.set(str(d["thickness"]))
            self._reset_missing(self.v_thick)
            filled.append(f"Thickness: {d['thickness']} mm")
        else:
            self._mark_missing(self.v_thick)

        self._update_weight()

        src = f"PDF + {OCR_BACKEND.upper()}" if d.get("used_ocr") else "PDF text"
        self.file_lbl.config(
            text=f"{os.path.basename(fp)} ({src})",
            fg=C['teal'] if not d['missing'] else '#dc2626')
        self.detect_lbl.config(
            text=("Detected — " + " | ".join(filled)) if filled
                 else "No values detected from PDF.")
        self.app.status.set_message(f"Loaded PDF: {os.path.basename(fp)}")

        # Try to look up Quantity in the Excel BOM (if one was uploaded).
        # PDF gives us material + thickness; the BOM gives us qty by drg_no.
        self._apply_qty_from_bom(d.get("drg_no", ""))

        if d["missing"]:
            messagebox.showwarning(
                "Missing Values — Enter Manually",
                "Could not detect the following from this PDF:\n\n  • "
                + "\n  • ".join(d["missing"])
                + "\n\nThese fields are highlighted in red. Enter the "
                  "values manually in the Material & Rate card.")

    def _cad_import_3d(self):
        if not HAS_OCC:
            messagebox.showwarning("3D CAD Not Available",
                "Install PythonOCC or CadQuery for STEP/IGES support.")
            return
        fp = filedialog.askopenfilename(title="Open STEP/IGES File",
            filetypes=[("STEP", "*.step *.stp"), ("IGES", "*.iges *.igs"), ("All", "*.*")])
        if not fp: return
        try:
            d = read_step_iges(fp)
            if d: self._apply_cad_data(d, fp)
            else: messagebox.showwarning("Error", "Could not read 3D file.")
        except Exception as e:
            messagebox.showerror("3D CAD Error", str(e))

    def _cad_view(self):
        if not self.dxf_path:
            messagebox.showinfo("", "Import a CAD file first"); return
        ext = os.path.splitext(self.dxf_path)[1].lower()
        if ext == ".dxf": render_dxf_2d(self.dxf_path)
        elif ext in (".step", ".stp", ".iges", ".igs"): render_3d_cad(self.dxf_path)

    def _clear_cad(self):
        self.dxf_path = None
        self.current_drg_no = ""
        self.file_lbl.config(text="No file loaded", fg=C['text2'])
        self.detect_lbl.config(text="")
        # Note: we intentionally do NOT clear the loaded BOM — the user can
        # quote several drawings against the same BOM in one session.

    def _nest_viz(self):
        if self.last_q and self.last_q.n:
            show_nesting_visual(self.last_q.n, q=self.last_q)
        else:
            messagebox.showinfo("", "Generate a quote first")

    def _pdf(self):
        if not self.last_q: messagebox.showinfo("", "Generate quote first"); return
        fp = filedialog.asksaveasfilename(defaultextension=".pdf", filetypes=[("PDF", "*.pdf")],
            initialfile=f"Quote_{self.v_name.get().replace(' ', '_')}.pdf")
        if fp:
            r = export_pdf(self.last_q, fp)
            messagebox.showinfo("Saved", f"Saved: {os.path.basename(r)}")

    def _xlsx(self):
        if not self.last_q: messagebox.showinfo("", "Generate quote first"); return
        fp = filedialog.asksaveasfilename(defaultextension=".xlsx", filetypes=[("Excel", "*.xlsx")],
            initialfile=f"Quote_{self.v_name.get().replace(' ', '_')}.xlsx")
        if fp:
            export_xlsx(self.last_q, fp)
            messagebox.showinfo("Saved", f"Saved: {fp}")

    def _clear(self):
        for v, d in [(self.v_name, "New Part"), (self.v_qty, "100"),
                     (self.v_mat, ""), (self.v_thick, ""), (self.v_rate, ""),
                     (self.v_len, "500"), (self.v_wid, "300"),
                     (self.v_cperi, "0"), (self.v_icut, "0"), (self.v_bends, "0"),
                     (self.v_blen, "0"), (self.v_holes, "0"), (self.v_hdia, "10"),
                     (self.v_wlen, "0"), (self.v_spots, "0"), (self.v_oh, "15"),
                     (self.v_pr, "10"), (self.v_kerf, "2"),
                     (self.v_hw, "0"), (self.v_wrap, "0"), (self.v_pack, "0"),
                     (self.v_customer, ""), (self.v_contact, ""), (self.v_cnotes, "")]:
            v.set(d)
        self.v_cut.set("laser"); self.v_wtype.set("mig")
        self.v_surf.set("None"); self.v_sheet.set("Auto-Best")
        self.v_ap_punch.set(False); self.v_ap_bend.set(False)
        self.v_ap_weld.set(False); self.v_ap_pc.set(False)
        self.file_lbl.config(text="No file loaded", fg=C['text2'])
        self.detect_lbl.config(text="")
        self.rpt_quote_no.config(text="")
        self.rpt_date.config(text=""); self.rpt_part.set("—")
        self.rpt_material.set("—"); self.rpt_dims.set("—"); self.rpt_flat.set("")
        self.nest_info.config(text="Generate a quote to see nesting results", fg=C['text2'])
        for item in self.tree.get_children(): self.tree.delete(item)
        self.d_wt.set("—"); self.d_rate.set("—")
        self.d_nest.set("—"); self.d_total.set("—")
        self.last_q = None; self.dxf_path = None; self._loaded_quote_id = None
        self.app.status.set_message("Ready")
