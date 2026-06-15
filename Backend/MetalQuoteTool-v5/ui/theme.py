import platform
import tkinter as tk

try:
    from tkmacosx import Button as MacButton
    _USE_MAC = (platform.system() == 'Darwin')
except ImportError:
    _USE_MAC = False


# ═══════════════════════════════════════════════════════════════
#  §1  BRAND COLORS  (matching BOM2CWS design language)
# ═══════════════════════════════════════════════════════════════

# ── Theme: Espresso & Burnt Orange (warm version of Option 2) ──
# Distinctly WARM dark tones — you can SEE the brown undertone, so
# nothing reads as "cool blue-black" on a colour-managed display.
#
#   ink       #2b211a   — primary dark (espresso brown-black)
#   graphite  #3a2e25   — toolbar / secondary dark (warm graphite)
#   border    #e5e0d6   — 1-px hairlines on cards
#   subtle    #f3eee5   — card-interior strips, footer band
#   bg        #faf6ee   — body / window background (warm off-white)
#   muted     #6e655a   — secondary text (labels, captions)
#   ACCENT    #d97706   — burnt orange — the SINGLE accent
#   accent_h  #b45309   — accent hover
C = {
    'bg':           '#2b211a',       # warm espresso — main app shell
    'card':         '#ffffff',       # white — card body fill
    'card_bg':      '#faf6ee',       # warm off-white card interior
    'header_bg':    '#2b211a',       # espresso header bar
    'header_fg':    '#ffffff',       # white text on header
    'card_hdr':     '#2b211a',       # card header strips
    'accent':       '#d97706',       # ★ burnt orange — sole accent
    'accent_hover': '#b45309',       # darker burnt orange
    'primary':      '#3a2e25',       # warm graphite primary buttons
    'primary_hover':'#4d3e33',
    'success':      '#d97706',       # success = accent (single-colour rule)
    'success_hover':'#b45309',
    'danger':       '#b91c1c',       # red kept for "delete" affordance
    'danger_hover': '#991b1b',
    'warning':      '#d97706',
    'warning_hover':'#b45309',
    'text':         '#2b211a',       # warm dark text on warm white
    'text2':        '#6e655a',       # muted warm grey
    'border':       '#e5e0d6',       # warm hairline borders
    'badge_bg':     '#f3eee5',
    'table_header': '#2b211a',
    'table_alt':    '#faf6ee',
    'selected':     '#fef3e2',       # very light orange tint
    'navy':         '#2b211a',       # legacy alias (espresso)
    'btn_blue':     '#3a2e25',       # repurposed: warm graphite button
    'btn_blue_h':   '#4d3e33',
    'teal':         '#d97706',       # legacy alias → accent
    'teal_h':       '#b45309',
    'purple':       '#6e655a',       # legacy alias → muted
    'struct':       '#2b211a',
    'sect_bg':      '#f3eee5',
    'divider':      '#e5e0d6',
    'input_bg':     '#faf6ee',
    'kpi_bg':       '#ffffff',
}

# ── Professional Font System ──
# Mac: SF Pro (system font) — clean, modern, Apple-native
# Windows fallback: Segoe UI — Microsoft's system font
# Linux fallback: Inter or Roboto or DejaVu Sans

_IS_MAC = platform.system() == 'Darwin'

if _IS_MAC:
    F = {
        'family':       'SF Pro Display',     # headings & titles
        'body':         'SF Pro Text',         # body text & labels
        'mono':         'SF Mono',             # numbers in tables
        'btn':          'SF Pro Text',         # button text
    }
else:
    F = {
        'family':       'Segoe UI',
        'body':         'Segoe UI',
        'mono':         'Consolas',
        'btn':          'Segoe UI',
    }

# Font presets — (family, size, weight)
FONT = {
    'h1':           (F['family'], 15, 'bold'),      # main title
    'h2':           (F['family'], 12, 'bold'),      # section titles
    'h3':           (F['family'], 10, 'bold'),      # card titles
    'body':         (F['body'],   10, ''),           # body text
    'body_sm':      (F['body'],    9, ''),           # small body
    'body_xs':      (F['body'],    8, ''),           # extra small
    'body_xxs':     (F['body'],    7, ''),           # tiny hints
    'label':        (F['body'],    9, ''),           # field labels
    'input':        (F['body'],   10, ''),           # input fields
    'badge':        (F['family'], 13, 'bold'),      # KPI values
    'badge_label':  (F['body'],    8, 'bold'),      # KPI labels
    'btn_lg':       (F['btn'],    13, 'bold'),      # large buttons
    'btn':          (F['btn'],     9, 'bold'),      # normal buttons
    'tbl_head':     (F['body'],    9, 'bold'),      # table headers
    'tbl_body':     (F['body'],   10, ''),           # table rows
    'tbl_bold':     (F['body'],   10, 'bold'),      # table bold rows
    'tbl_grand':    (F['body'],   11, 'bold'),      # grand total
    'status':       (F['body'],    9, ''),           # status bar
    'pill':         (F['body'],    9, ''),           # pills/tags
    'rate':         (F['body'],   10, 'bold'),      # rate display
    'section':      (F['family'], 10, 'bold'),      # section headers
    'flat_hint':    (F['body'],    8, 'italic'),    # flat pattern hint
    'file_loaded':  (F['body'],    8, 'italic'),    # file info
    'detect':       (F['body'],    7, ''),           # detection summary
    'info_label':   (F['body'],    9, 'bold'),      # info labels
    'info_value':   (F['body'],   10, ''),           # info values
    'popup_title':  (F['family'], 11, 'bold'),      # popup titles
}


def _btn(parent, text, bg, fg, cmd, size=None, px=20, py=8, hover=None, width=None):
    """Create a styled button that reliably shows colors on macOS."""
    font_key = 'btn_lg' if (size and size >= 12) else 'btn'
    fnt = FONT[font_key]
    if size:
        fnt = (fnt[0], size, fnt[2])
    if _USE_MAC:
        b = MacButton(parent, text=f"  {text}  ", font=fnt,
                      bg=bg, fg=fg, focuscolor=bg, activebackground=hover or bg,
                      activeforeground=fg, borderless=False, borderwidth=0,
                      cursor='hand2', padx=px, pady=py, command=cmd)
        if width: b.config(width=width)
        if hover:
            b.bind('<Enter>', lambda e: b.config(bg=hover))
            b.bind('<Leave>', lambda e: b.config(bg=bg))
        return b
    # macOS ignores bg/fg on tk.Button — use a Label-based button instead
    # This reliably renders colored backgrounds with visible text on Mac
    b = tk.Label(parent, text=f"  {text}  ", font=fnt,
                 bg=bg, fg=fg, cursor='hand2', padx=px, pady=py)
    _bg = bg
    _hover = hover
    def on_click(e):
        b.config(bg=_bg)
        b.after(50, cmd)   # slight delay so visual feedback shows
    b.bind('<ButtonRelease-1>', on_click)
    if hover:
        b.bind('<Enter>', lambda e: b.config(bg=_hover))
        b.bind('<Leave>', lambda e: b.config(bg=_bg))
    return b
