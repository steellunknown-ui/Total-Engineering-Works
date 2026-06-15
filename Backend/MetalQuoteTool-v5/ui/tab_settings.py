"""Tab 4 — Settings: rate bands, standard sheets, surfaces, company branding.
Persists to the DB `settings` table as JSON; applies changes in-memory.
"""
import tkinter as tk
from tkinter import ttk, messagebox

from ui.theme import C, FONT, _btn
from data import constants as K


class SettingsTab(tk.Frame):
    def __init__(self, parent, app):
        super().__init__(parent, bg=C['bg'])
        self.app = app

        nb = ttk.Notebook(self)
        nb.pack(fill='both', expand=True, padx=8, pady=8)

        self._build_rate_bands(nb)
        self._build_process_rates(nb)
        self._build_sheets(nb)
        self._build_surfaces(nb)
        self._build_branding(nb)

    # ── A. Rate Bands ──
    def _build_rate_bands(self, nb):
        frame = tk.Frame(nb, bg=C['bg'])
        nb.add(frame, text='Rate Bands')

        cols = ('Material', 'Thickness', 'Low ₹/kg', 'High ₹/kg')
        self.rb_tree = ttk.Treeview(frame, columns=cols, show='headings',
                                     style='Q.Treeview', height=14)
        for c in cols:
            self.rb_tree.heading(c, text=c)
            self.rb_tree.column(c, width=140, anchor='center')
        self.rb_tree.pack(fill='both', expand=True, padx=8, pady=8)
        self._refresh_rb()

        edit = tk.Frame(frame, bg=C['card'], padx=8, pady=8,
                        highlightbackground=C['border'], highlightthickness=1)
        edit.pack(fill='x', padx=8, pady=4)
        self.rb_low = tk.StringVar()
        self.rb_high = tk.StringVar()
        tk.Label(edit, text="Selected: low", font=FONT['label'],
                 bg=C['card'], fg=C['text2']).pack(side='left')
        tk.Entry(edit, textvariable=self.rb_low, width=8).pack(side='left', padx=4)
        tk.Label(edit, text="high", font=FONT['label'],
                 bg=C['card'], fg=C['text2']).pack(side='left')
        tk.Entry(edit, textvariable=self.rb_high, width=8).pack(side='left', padx=4)
        _btn(edit, "Apply", C['success'], 'white', self._apply_rb,
             size=9, px=10, py=4, hover=C['success_hover']).pack(side='left', padx=6)
        _btn(edit, "Save", C['btn_blue'], 'white', self._save_rb,
             size=9, px=10, py=4, hover=C['btn_blue_h']).pack(side='right', padx=3)
        _btn(edit, "Reset to Default", C['primary'], 'white', self._reset_rb,
             size=9, px=10, py=4, hover='#64748b').pack(side='right', padx=3)
        self.rb_tree.bind('<<TreeviewSelect>>', self._on_rb_select)

    def _refresh_rb(self):
        for item in self.rb_tree.get_children():
            self.rb_tree.delete(item)
        for mat, rows in K.RATE_BANDS.items():
            for t, lo, hi in rows:
                self.rb_tree.insert('', 'end', values=(mat, t, lo, hi))

    def _on_rb_select(self, *_):
        sel = self.rb_tree.selection()
        if not sel:
            return
        v = self.rb_tree.item(sel[0], 'values')
        self.rb_low.set(v[2]); self.rb_high.set(v[3])

    def _apply_rb(self):
        sel = self.rb_tree.selection()
        if not sel:
            return
        mat, t, _, _ = self.rb_tree.item(sel[0], 'values')
        try:
            lo = float(self.rb_low.get())
            hi = float(self.rb_high.get())
        except ValueError:
            messagebox.showerror("Bad input", "Rates must be numeric"); return
        t = float(t)
        K.RATE_BANDS[mat] = [(tt, lo, hi) if abs(tt - t) < 0.01 else (tt, l2, h2)
                              for tt, l2, h2 in K.RATE_BANDS[mat]]
        self._refresh_rb()

    def _save_rb(self):
        payload = {mat: [list(t) for t in rows] for mat, rows in K.RATE_BANDS.items()}
        self.app.db.set_setting("rate_bands", payload)
        self.app.status.set_message("Saved rate bands")

    def _reset_rb(self):
        # Re-import module to pick up original defaults
        import importlib
        importlib.reload(K)
        self.app.db.conn.execute("DELETE FROM settings WHERE key = 'rate_bands'")
        self.app.db.conn.commit()
        self._refresh_rb()
        self.app.status.set_message("Rate bands reset to defaults")

    # ── A2. Process Rates (MEPL Standard RM Rate Format, ₹/kg) ──
    def _build_process_rates(self, nb):
        frame = tk.Frame(nb, bg=C['bg'])
        nb.add(frame, text='Process Rates')

        hdr = tk.Label(frame,
            text="MEPL Standard RM Rate Format — ₹ per kg of part weight",
            font=FONT['label'], bg=C['bg'], fg=C['text2'])
        hdr.pack(anchor='w', padx=12, pady=(10, 4))

        body = tk.Frame(frame, bg=C['card'], padx=16, pady=16,
                        highlightbackground=C['border'], highlightthickness=1)
        body.pack(fill='x', padx=8, pady=4)

        self._pr_vars = {}
        rows = [
            ("punching", "Punching", "₹/kg"),
            ("bending", "Bending", "₹/kg"),
            ("welding", "Welding & Fab.", "₹/kg"),
            ("powder_coating_dual", "Powder Coating (Dual Shade)", "₹/kg"),
        ]
        for i, (key, label, unit) in enumerate(rows):
            tk.Label(body, text=label, font=FONT['label'], bg=C['card'],
                     fg=C['text2'], anchor='w', width=28).grid(
                     row=i, column=0, sticky='w', pady=6)
            v = tk.StringVar(value=str(K.STD_RATES_PER_KG.get(key, 0)))
            tk.Entry(body, textvariable=v, width=10, font=FONT['input'],
                     relief='solid', bd=1, bg=C['input_bg']).grid(
                     row=i, column=1, sticky='w', pady=6)
            tk.Label(body, text=unit, font=FONT['label'], bg=C['card'],
                     fg=C['text2']).grid(row=i, column=2, sticky='w', padx=6)
            self._pr_vars[key] = v

        bar = tk.Frame(frame, bg=C['card'], padx=8, pady=8,
                       highlightbackground=C['border'], highlightthickness=1)
        bar.pack(fill='x', padx=8, pady=4)
        _btn(bar, "Save", C['btn_blue'], 'white', self._save_pr,
             size=9, px=10, py=4, hover=C['btn_blue_h']).pack(side='right', padx=3)
        _btn(bar, "Reset to Default", C['primary'], 'white', self._reset_pr,
             size=9, px=10, py=4, hover='#64748b').pack(side='right', padx=3)

    def _save_pr(self):
        try:
            payload = {k: float(v.get()) for k, v in self._pr_vars.items()}
        except ValueError:
            messagebox.showerror("Bad input", "Rates must be numeric"); return
        K.STD_RATES_PER_KG.update(payload)
        self.app.db.set_setting("std_rates_per_kg", payload)
        self.app.status.set_message("Saved process rates")

    def _reset_pr(self):
        import importlib
        importlib.reload(K)
        self.app.db.conn.execute("DELETE FROM settings WHERE key = 'std_rates_per_kg'")
        self.app.db.conn.commit()
        for key, var in self._pr_vars.items():
            var.set(str(K.STD_RATES_PER_KG.get(key, 0)))
        self.app.status.set_message("Process rates reset to defaults")

    # ── B. Standard Sheets ──
    def _build_sheets(self, nb):
        frame = tk.Frame(nb, bg=C['bg'])
        nb.add(frame, text='Standard Sheets')
        cols = ('Name', 'Length', 'Width')
        self.sh_tree = ttk.Treeview(frame, columns=cols, show='headings',
                                     style='Q.Treeview', height=14)
        for c in cols:
            self.sh_tree.heading(c, text=c)
            self.sh_tree.column(c, width=220 if c == 'Name' else 100,
                                anchor='w' if c == 'Name' else 'center')
        self.sh_tree.pack(fill='both', expand=True, padx=8, pady=8)
        for name, (l, w) in K.STANDARD_SHEETS.items():
            self.sh_tree.insert('', 'end', values=(name, l, w))

        bar = tk.Frame(frame, bg=C['card'], padx=8, pady=8,
                       highlightbackground=C['border'], highlightthickness=1)
        bar.pack(fill='x', padx=8, pady=4)
        _btn(bar, "Save", C['btn_blue'], 'white',
             lambda: (self.app.db.set_setting("standard_sheets",
                 {name: list(dims) for name, dims in K.STANDARD_SHEETS.items()}),
                 self.app.status.set_message("Saved standard sheets")),
             size=9, px=10, py=4, hover=C['btn_blue_h']).pack(side='right', padx=3)

    # ── C. Surface Prices ──
    def _build_surfaces(self, nb):
        frame = tk.Frame(nb, bg=C['bg'])
        nb.add(frame, text='Surface Prices')
        cols = ('Coating', '₹/sqm')
        self.sf_tree = ttk.Treeview(frame, columns=cols, show='headings',
                                     style='Q.Treeview', height=14)
        for c in cols:
            self.sf_tree.heading(c, text=c)
            self.sf_tree.column(c, width=220 if c == 'Coating' else 120,
                                anchor='w' if c == 'Coating' else 'center')
        self.sf_tree.pack(fill='both', expand=True, padx=8, pady=8)
        for name, price in K.SURFACES.items():
            self.sf_tree.insert('', 'end', values=(name, price))

        bar = tk.Frame(frame, bg=C['card'], padx=8, pady=8,
                       highlightbackground=C['border'], highlightthickness=1)
        bar.pack(fill='x', padx=8, pady=4)
        _btn(bar, "Save", C['btn_blue'], 'white',
             lambda: (self.app.db.set_setting("surfaces", dict(K.SURFACES)),
                 self.app.status.set_message("Saved surface prices")),
             size=9, px=10, py=4, hover=C['btn_blue_h']).pack(side='right', padx=3)

    # ── D. Company/Branding ──
    def _build_branding(self, nb):
        frame = tk.Frame(nb, bg=C['bg'])
        nb.add(frame, text='Company')
        body = tk.Frame(frame, bg=C['card'], padx=20, pady=20,
                        highlightbackground=C['border'], highlightthickness=1)
        body.pack(fill='both', expand=True, padx=8, pady=8)

        current = self.app.db.get_setting("company", {}) or {}
        self._bvars = {}
        fields = [
            ("company_name", "Company name:"),
            ("gst_number", "GST number:"),
            ("default_overhead", "Default overhead %:"),
            ("default_profit", "Default profit %:"),
            ("default_cut", "Default cut method:"),
            ("default_weld", "Default weld type:"),
            ("output_folder", "Default output folder:"),
            ("backup_folder", "DB backup folder:"),
        ]
        for i, (key, lbl) in enumerate(fields):
            tk.Label(body, text=lbl, font=FONT['label'], bg=C['card'],
                     fg=C['text2'], anchor='w', width=22).grid(row=i, column=0,
                                                                sticky='w', pady=4)
            v = tk.StringVar(value=str(current.get(key, "")))
            tk.Entry(body, textvariable=v, width=44, font=FONT['input'],
                     relief='solid', bd=1, bg=C['input_bg']).grid(row=i, column=1,
                                                                   sticky='w', pady=4)
            self._bvars[key] = v

        _btn(body, "Save", C['btn_blue'], 'white', self._save_branding,
             size=10, px=14, py=5, hover=C['btn_blue_h']).grid(
            row=len(fields), column=1, sticky='e', pady=10)

    def _save_branding(self):
        payload = {k: v.get() for k, v in self._bvars.items()}
        self.app.db.set_setting("company", payload)
        self.app.status.set_message("Saved company settings")
