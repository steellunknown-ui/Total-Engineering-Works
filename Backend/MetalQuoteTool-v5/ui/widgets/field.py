import tkinter as tk
from tkinter import ttk
from ui.theme import C, FONT


def make_field(parent, label, row, default="", w=14, unit=""):
    tk.Label(parent, text=label, font=FONT['label'], fg=C['text2'],
             bg=C['card']).grid(row=row, column=0, sticky='w', padx=4, pady=3)
    v = tk.StringVar(value=str(default))
    ef = tk.Frame(parent, bg=C['card'])
    ef.grid(row=row, column=1, sticky='w', padx=4, pady=3)
    e = tk.Entry(ef, textvariable=v, width=w, font=FONT['input'],
                 relief='solid', bd=1, bg=C['input_bg'], fg='#2b211a',
                 insertbackground='#2b211a',
                 highlightcolor=C['teal'], highlightthickness=1)
    e.pack(side='left')
    if unit:
        tk.Label(ef, text=unit, font=FONT['label'], fg=C['text2'],
                 bg=C['card']).pack(side='left', padx=3)
    # Attach the entry widget for callers that need to style it (e.g., red
    # highlight when a PDF import can't find the value).
    v._entry = e
    return v


def make_dropdown(parent, label, row, vals, default=None, w=20):
    tk.Label(parent, text=label, font=FONT['label'], fg=C['text2'],
             bg=C['card']).grid(row=row, column=0, sticky='w', padx=4, pady=3)
    v = tk.StringVar(value=default or vals[0])
    cb = ttk.Combobox(parent, textvariable=v, values=vals, width=w, state='readonly')
    cb.grid(row=row, column=1, sticky='w', padx=4, pady=3)
    return v, cb
