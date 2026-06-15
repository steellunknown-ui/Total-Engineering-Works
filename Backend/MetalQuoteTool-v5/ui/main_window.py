from pathlib import Path
import tkinter as tk
from tkinter import ttk

from ui.theme import C, FONT, _btn
from ui.widgets.status_bar import StatusBar


APP_NAME = "MEPL Sheet Metal Quote Tool"
LOGO_PATH = Path(__file__).resolve().parent / "header_logo.png"


class MetalQuoteApp(tk.Tk):
    """Top-level window: header bar · 4-tab Notebook · status bar."""

    def __init__(self, db, occ_backend: str = ""):
        super().__init__()
        self.db = db
        self.title(APP_NAME)
        self.geometry("1380x920")
        self.minsize(1100, 750)
        self.configure(bg=C['bg'])
        self._setup_styles()
        self._build_header()
        self._build_notebook()
        self.status = StatusBar(self, db_path=str(db.db_path), occ_backend=occ_backend)
        self.status.pack(side='bottom', fill='x')
        self.refresh_header_stats()
        # Pull the window to the foreground on launch (macOS doesn't do this
        # automatically when Tk is launched from a terminal).
        self.after(50, self._raise_window)

    def _raise_window(self) -> None:
        self.lift()
        self.attributes('-topmost', True)
        self.after(200, lambda: self.attributes('-topmost', False))
        self.focus_force()

    def _setup_styles(self) -> None:
        s = ttk.Style(); s.theme_use('default')
        s.configure('Q.Treeview', font=FONT['tbl_body'], rowheight=28,
                    background='#ffffff', fieldbackground='#ffffff',
                    foreground=C['text'])
        s.configure('Q.Treeview.Heading', font=FONT['tbl_head'],
                    background=C['navy'], foreground='#ffffff',
                    relief='flat', padding=(8, 5))
        s.map('Q.Treeview', background=[('selected', C['selected'])],
              foreground=[('selected', C['text'])])
        s.map('Q.Treeview.Heading', background=[('active', '#3a2e25')])
        s.configure('TCombobox', fieldbackground='#ffffff',
                    background='#ffffff', font=FONT['input'])
        # ── Notebook tabs — modern pill-style with accent-on-active ──
        s.configure('TNotebook', background=C['bg'], borderwidth=0,
                    tabmargins=(8, 6, 8, 0))
        s.configure('TNotebook.Tab',
                    padding=(22, 10), font=FONT['h3'],
                    background='#3a2e25', foreground='#a8a094',
                    borderwidth=0, focuscolor=C['bg'])
        s.map('TNotebook.Tab',
              background=[('selected', '#ffffff'),
                          ('active',   '#6e655a')],
              foreground=[('selected', C['navy']),
                          ('active',   '#ffffff')],
              expand=[('selected', (1, 1, 1, 0))])

    def _build_header(self) -> None:
        # ── Two-row header: dark navy band with logo + title (left) and
        #     a single-line stats strip (right). Bottom 3-px teal accent
        #     line gives the header a finished, branded edge. ──
        hdr = tk.Frame(self, bg=C['navy'], height=72)
        hdr.pack(fill='x'); hdr.pack_propagate(False)

        inner = tk.Frame(hdr, bg=C['navy'])
        inner.pack(fill='both', expand=True, padx=24, pady=10)

        # Left side — logo + brand block
        left = tk.Frame(inner, bg=C['navy'])
        left.pack(side='left', fill='y')

        self._logo_img = None
        try:
            if LOGO_PATH.exists():
                from PIL import Image, ImageTk
                img = Image.open(LOGO_PATH)
                img.thumbnail((52, 52), Image.LANCZOS)
                self._logo_img = ImageTk.PhotoImage(img)
                tk.Label(left, image=self._logo_img,
                         bg=C['navy']).pack(side='left', padx=(0, 14))
        except Exception:
            pass

        brand = tk.Frame(left, bg=C['navy'])
        brand.pack(side='left', fill='y', anchor='w')
        tk.Label(brand, text=APP_NAME, font=FONT['h1'],
                 bg=C['navy'], fg='#ffffff').pack(anchor='w')
        tk.Label(brand, text="Sheet Metal Fabrication Quoting · v5.0",
                 font=(FONT['body'][0], 10, 'italic'),
                 bg=C['navy'], fg=C['accent']).pack(anchor='w', pady=(2, 0))

        # Right side — stats pill
        right = tk.Frame(inner, bg=C['navy'])
        right.pack(side='right', fill='y')

        self.header_stats = tk.Label(
            right, text="",
            font=(FONT['body'][0], 10, 'bold'),
            bg='#2b211a', fg='#a8a094',
            padx=14, pady=8)
        self.header_stats.pack(side='right')

        # Header Generate button holder (used by some tabs).
        self._header_gen_btn_holder = tk.Frame(right, bg=C['navy'])
        self._header_gen_btn_holder.pack(side='right', padx=(0, 10))

        # Subtle teal accent line under the header.
        tk.Frame(self, bg=C['accent'], height=3).pack(fill='x')

    def _build_notebook(self) -> None:
        nb = ttk.Notebook(self)
        nb.pack(fill='both', expand=True, padx=8, pady=(8, 0))
        self.notebook = nb

        # Import here to avoid circular imports
        from ui.tab_fab_sheet import FabSheetTab
        from ui.tab_settings import SettingsTab

        self.tab_fab = FabSheetTab(nb, self)
        self.tab_settings = SettingsTab(nb, self)

        nb.add(self.tab_fab, text='FAB Sheet')
        nb.add(self.tab_settings, text='Settings')

    def refresh_header_stats(self) -> None:
        s = self.db.stats()
        txt = f"Quotes: {s['total_quotes']} · Month: {s['this_month']} · Value: ₹{s['total_value']:,.0f}"
        self.header_stats.config(text=txt)
