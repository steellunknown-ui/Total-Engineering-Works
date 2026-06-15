#!/usr/bin/env python3
"""MEPL Sheet Metal Quote Tool — entry point."""
import os
import sys
from pathlib import Path

# Ensure the project root is on sys.path when launched from anywhere
ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from data.db import QuoteDB
from data import constants
from ui.main_window import MetalQuoteApp
from core.cad_reader import OCC_BACKEND


def main() -> None:
    db = QuoteDB()
    constants.load_overrides(db)
    app = MetalQuoteApp(db, occ_backend=OCC_BACKEND or "")
    # Bootstrap banner — when launched from a terminal, print enough info for
    # the user to confirm the app is alive even if the window is off-screen
    # or behind another app.
    # `sys.stdout` is None when PyInstaller bundles the app with
    # --windowed (no console), so isatty() would crash. Guard it.
    try:
        if sys.stdout is not None and sys.stdout.isatty():
            app.update_idletasks()
            print(
                f"MEPL Sheet Metal Quote Tool v5.0 — PID {os.getpid()} — "
                f"window at {app.geometry()}", flush=True)
    except Exception:
        pass
    app.mainloop()


if __name__ == '__main__':
    main()
