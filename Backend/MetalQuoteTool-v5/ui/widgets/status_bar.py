import sys
import tkinter as tk
from ui.theme import C, FONT


class StatusBar(tk.Frame):
    """Bottom status bar showing DB path, last action, and version info."""

    def __init__(self, parent, db_path: str, version: str = "5.0",
                 occ_backend: str = ""):
        # Two-layer frame: a 1-px top border line + the body. The border
        # gives the status bar a finished, "snapped-to-bottom" feel.
        super().__init__(parent, bg=C['border'], height=33)
        self.pack_propagate(False)

        body = tk.Frame(self, bg='#f3eee5')
        body.pack(fill='both', expand=True, padx=0, pady=(1, 0))

        shortened = self._shorten(db_path)

        # Left: live status indicator (green dot) + DB path
        left = tk.Frame(body, bg='#f3eee5')
        left.pack(side='left', fill='y', padx=(14, 0))
        tk.Label(left, text="●", bg='#f3eee5', fg=C['accent'],
                 font=(FONT['body'][0], 10, 'bold')).pack(side='left')
        tk.Label(left, text="Ready",
                 bg='#f3eee5', fg=C['text'],
                 font=(FONT['body'][0], 9, 'bold')).pack(side='left', padx=(4, 14))
        tk.Label(left, text=f"DB: {shortened}",
                 font=FONT['status'], bg='#f3eee5',
                 fg=C['text2']).pack(side='left')

        # Middle: free-form action / progress message
        self._middle = tk.Label(body, text="",
                                 font=(FONT['body'][0], 9, 'italic'),
                                 bg='#f3eee5', fg='#6e655a')
        self._middle.pack(side='left', expand=True)

        # Right: version pill
        occ_text = occ_backend or "not installed"
        pyver = f"{sys.version_info.major}.{sys.version_info.minor}"
        right = tk.Frame(body, bg='#f3eee5')
        right.pack(side='right', fill='y', padx=(0, 12))
        tk.Label(right,
                 text=f"  v{version}  ·  Python {pyver}  ·  OCC: {occ_text}  ",
                 font=FONT['status'], bg='#e5e0d6', fg=C['text2']
                 ).pack(side='right', pady=6)

    @staticmethod
    def _shorten(p: str) -> str:
        import os
        home = os.path.expanduser("~")
        if p.startswith(home):
            return "~" + p[len(home):]
        return p

    def set_message(self, text: str) -> None:
        # Briefly bold + dark on update, then fade back to italic muted —
        # gives the operator a perceptible "something happened" signal.
        self._middle.config(text=text,
                             font=(FONT['body'][0], 9, 'bold'),
                             fg=C['text'])
        # After 2.5 s, soften the styling.
        try:
            self._middle.after(2500, lambda: self._middle.config(
                font=(FONT['body'][0], 9, 'italic'), fg='#6e655a'))
        except Exception:
            pass
