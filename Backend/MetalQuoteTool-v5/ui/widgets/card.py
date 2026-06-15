import tkinter as tk
from ui.theme import C, FONT


def make_card(parent, title: str) -> tk.Frame:
    """Dark navy header + white body card. Returns the body frame."""
    outer = tk.Frame(parent, bg=C['bg'])
    outer.pack(fill='x', padx=2, pady=4)
    hdr = tk.Frame(outer, bg=C['card_hdr'], height=32)
    hdr.pack(fill='x'); hdr.pack_propagate(False)
    tk.Label(hdr, text=f"  {title}", font=FONT['h3'],
             bg=C['card_hdr'], fg='#ffffff').pack(side='left', padx=8)
    body = tk.Frame(outer, bg=C['card'], padx=14, pady=10,
                    highlightbackground=C['border'], highlightthickness=1)
    body.pack(fill='x')
    return body
