"""SQLite persistence layer for Metal Quick Quote v5.

Stores quotes, line items, batches, and user settings. A single ``QuoteDB``
instance is shared across the UI tabs. The default on-disk location is
resolved via ``platformdirs`` so each OS gets a sensible user-data folder.
"""
from __future__ import annotations

import json
import sqlite3
import dataclasses
from datetime import datetime
from pathlib import Path
from typing import Optional

from core.quote_engine import Quote, QLine
from core.nesting import Nest


# ═══════════════════════════════════════════════════════════════
#  Serialization helpers (SPEC §7)
# ═══════════════════════════════════════════════════════════════

def quote_to_json(q: Quote) -> str:
    d = dataclasses.asdict(q)
    return json.dumps(d, default=str)


def quote_from_json(s: str) -> Quote:
    d = json.loads(s)
    lines = [QLine(**l) for l in d.pop('lines', [])]
    nest_data = d.pop('n', None)
    q = Quote(**d)
    q.lines = lines
    if nest_data:
        q.n = Nest(**nest_data)
    return q


def _default_db_path() -> Path:
    try:
        from platformdirs import user_data_dir
        base = Path(user_data_dir("MetalQuote", appauthor=False))
    except ImportError:
        base = Path.home() / ".local" / "share" / "MetalQuote"
    base.mkdir(parents=True, exist_ok=True)
    return base / "quotes.sqlite"


# ═══════════════════════════════════════════════════════════════
#  Schema (SPEC §2)
# ═══════════════════════════════════════════════════════════════

_SCHEMA = """
CREATE TABLE IF NOT EXISTS quotes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_no        TEXT UNIQUE NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    customer        TEXT DEFAULT '',
    part_name       TEXT NOT NULL,
    material        TEXT NOT NULL,
    thickness       REAL NOT NULL,
    length_mm       REAL NOT NULL,
    width_mm        REAL NOT NULL,
    box_height_mm   REAL DEFAULT 0,
    qty             INTEGER NOT NULL,
    rate_per_kg     REAL NOT NULL,
    slider_pct      INTEGER DEFAULT 50,
    weight_kg       REAL,
    subtotal        REAL,
    overhead_pct    REAL,
    overhead        REAL,
    profit_pct      REAL,
    profit          REAL,
    per_piece       REAL,
    total           REAL NOT NULL,
    surface         TEXT DEFAULT 'None',
    cut_method      TEXT DEFAULT 'laser',
    weld_type       TEXT DEFAULT 'mig',
    n_bends         INTEGER DEFAULT 0,
    n_holes         INTEGER DEFAULT 0,
    cad_file        TEXT DEFAULT '',
    pdf_path        TEXT DEFAULT '',
    xlsx_path       TEXT DEFAULT '',
    nest_json       TEXT DEFAULT '',
    quote_json      TEXT NOT NULL,
    status          TEXT DEFAULT 'draft'
);

CREATE TABLE IF NOT EXISTS quote_lines (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id    INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    seq         INTEGER NOT NULL,
    description TEXT NOT NULL,
    unit        TEXT,
    qty         REAL,
    rate        REAL,
    amount      REAL
);

CREATE TABLE IF NOT EXISTS batches (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_no    TEXT UNIQUE NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    customer    TEXT DEFAULT '',
    note        TEXT DEFAULT '',
    total       REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS batch_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id    INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    quote_id    INTEGER REFERENCES quotes(id) ON DELETE SET NULL,
    seq         INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS process_cache (
    drg_key     TEXT PRIMARY KEY,
    process     TEXT NOT NULL,
    source      TEXT NOT NULL DEFAULT 'manual',
    updated_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_quotes_customer   ON quotes(customer);
CREATE INDEX IF NOT EXISTS idx_quotes_created    ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_material   ON quotes(material);
CREATE INDEX IF NOT EXISTS idx_quotes_status     ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_lines_quote       ON quote_lines(quote_id);
"""


# ═══════════════════════════════════════════════════════════════
#  QuoteDB
# ═══════════════════════════════════════════════════════════════

class QuoteDB:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = Path(db_path) if db_path else _default_db_path()
        if str(self.db_path) != ":memory:":
            self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(self.db_path))
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA foreign_keys = ON")
        self._init_schema()

    def _init_schema(self) -> None:
        self.conn.executescript(_SCHEMA)
        self.conn.commit()

    # ── quote numbers ──
    def _next_quote_no(self) -> str:
        year = datetime.now().year
        cur = self.conn.execute(
            "SELECT quote_no FROM quotes WHERE quote_no LIKE ? ORDER BY id DESC LIMIT 1",
            (f"MQ-{year}-%",))
        row = cur.fetchone()
        next_n = int(row[0].split("-")[2]) + 1 if row else 1
        return f"MQ-{year}-{next_n:04d}"

    # ── quotes ──
    def save_quote(self, q: Quote, customer: str = "", cad_file: str = "",
                   cut_method: str = "laser", weld_type: str = "mig",
                   box_height_mm: float = 0) -> int:
        """Insert quote + lines. Returns quote id."""
        quote_no = self._next_quote_no()
        nest_json = json.dumps(dataclasses.asdict(q.n)) if q.n else ""
        qjson = quote_to_json(q)
        n_bends = sum(1 for l in q.lines if l.desc.startswith("Bending"))
        n_holes_from_lines = sum(int(l.qty) for l in q.lines if l.desc.startswith("Punching"))

        cur = self.conn.execute(
            """INSERT INTO quotes (
                quote_no, customer, part_name, material, thickness,
                length_mm, width_mm, box_height_mm, qty, rate_per_kg,
                slider_pct, weight_kg, subtotal, overhead_pct, overhead,
                profit_pct, profit, per_piece, total, surface, cut_method,
                weld_type, n_bends, n_holes, cad_file, nest_json, quote_json
               ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (quote_no, customer, q.name, q.mat, q.t,
             q.pl, q.pw, box_height_mm, q.qty, q.rate_kg,
             int(q.slider), q.weight, q.sub, q.overhead_pct, q.overhead,
             q.profit_pct, q.profit, q.per_pc, q.total, q.surface, cut_method,
             weld_type, n_bends, n_holes_from_lines, cad_file, nest_json, qjson))
        quote_id = cur.lastrowid
        for seq, line in enumerate(q.lines, start=1):
            self.conn.execute(
                """INSERT INTO quote_lines (quote_id, seq, description, unit, qty, rate, amount)
                   VALUES (?,?,?,?,?,?,?)""",
                (quote_id, seq, line.desc, line.unit, line.qty, line.rate, line.amt))
        self.conn.commit()
        return quote_id

    def load_quote(self, quote_id: int) -> Quote:
        row = self.conn.execute(
            "SELECT quote_json FROM quotes WHERE id = ?", (quote_id,)).fetchone()
        if not row:
            raise KeyError(f"Quote {quote_id} not found")
        return quote_from_json(row["quote_json"])

    def update_status(self, quote_id: int, status: str) -> None:
        self.conn.execute(
            "UPDATE quotes SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?",
            (status, quote_id))
        self.conn.commit()

    def delete_quote(self, quote_id: int) -> None:
        self.conn.execute("DELETE FROM quotes WHERE id = ?", (quote_id,))
        self.conn.commit()

    def list_quotes(self, *, customer: Optional[str] = None,
                    date_from: Optional[str] = None, date_to: Optional[str] = None,
                    material: Optional[str] = None, status: Optional[str] = None,
                    search: Optional[str] = None, limit: int = 500) -> list[dict]:
        where = []
        params: list = []
        if customer:
            where.append("customer = ?"); params.append(customer)
        if material:
            where.append("material = ?"); params.append(material)
        if status:
            where.append("status = ?"); params.append(status)
        if date_from:
            where.append("created_at >= ?"); params.append(date_from)
        if date_to:
            where.append("created_at <= ?"); params.append(date_to)
        if search:
            where.append("(part_name LIKE ? OR customer LIKE ? OR quote_no LIKE ?)")
            like = f"%{search}%"; params += [like, like, like]
        sql = "SELECT * FROM quotes"
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        return [dict(r) for r in self.conn.execute(sql, params).fetchall()]

    # ── batches ──
    def _next_batch_no(self) -> str:
        year = datetime.now().year
        row = self.conn.execute(
            "SELECT batch_no FROM batches WHERE batch_no LIKE ? ORDER BY id DESC LIMIT 1",
            (f"BATCH-{year}-%",)).fetchone()
        next_n = int(row[0].split("-")[2]) + 1 if row else 1
        return f"BATCH-{year}-{next_n:04d}"

    def save_batch(self, items: list[Quote], customer: str = "", note: str = "") -> int:
        """Save a list of Quotes as individual rows plus a batch grouping row."""
        batch_no = self._next_batch_no()
        total = sum(q.total for q in items)
        cur = self.conn.execute(
            "INSERT INTO batches (batch_no, customer, note, total) VALUES (?,?,?,?)",
            (batch_no, customer, note, total))
        batch_id = cur.lastrowid
        for seq, q in enumerate(items, start=1):
            quote_id = self.save_quote(q, customer=customer)
            self.conn.execute(
                "INSERT INTO batch_items (batch_id, quote_id, seq) VALUES (?,?,?)",
                (batch_id, quote_id, seq))
        self.conn.commit()
        return batch_id

    # ── settings ──
    def get_setting(self, key: str, default=None):
        row = self.conn.execute(
            "SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
        if row is None:
            return default
        try:
            return json.loads(row["value"])
        except (ValueError, TypeError):
            return default

    def set_setting(self, key: str, value) -> None:
        payload = json.dumps(value)
        self.conn.execute(
            """INSERT INTO settings (key, value) VALUES (?,?)
               ON CONFLICT(key) DO UPDATE SET
                   value = excluded.value,
                   updated_at = datetime('now','localtime')""",
            (key, payload))
        self.conn.commit()

    # ── process cache (drg_name → process lookup) ──
    def get_process(self, drg_key: str) -> str | None:
        """Return the cached process for this normalized drawing key, or None."""
        row = self.conn.execute(
            "SELECT process FROM process_cache WHERE drg_key = ?",
            (drg_key,)).fetchone()
        return row["process"] if row else None

    def set_process(self, drg_key: str, process: str, source: str = "manual") -> None:
        """Cache process for this part. Overwrites existing entry.
        `source` is 'excel' | 'manual' — 'manual' edits take highest priority."""
        self.conn.execute(
            """INSERT INTO process_cache (drg_key, process, source, updated_at)
               VALUES (?,?,?, datetime('now','localtime'))
               ON CONFLICT(drg_key) DO UPDATE SET
                   process = excluded.process,
                   source = excluded.source,
                   updated_at = datetime('now','localtime')""",
            (drg_key, process, source))
        self.conn.commit()

    def get_all_processes(self) -> dict[str, str]:
        """Return entire cache as {drg_key: process}. Loaded once at app start."""
        rows = self.conn.execute(
            "SELECT drg_key, process FROM process_cache").fetchall()
        return {r["drg_key"]: r["process"] for r in rows}

    # ── stats ──
    def stats(self) -> dict:
        total_quotes = self.conn.execute(
            "SELECT COUNT(*) FROM quotes").fetchone()[0]
        total_value = self.conn.execute(
            "SELECT COALESCE(SUM(total), 0) FROM quotes").fetchone()[0]
        this_month = self.conn.execute(
            "SELECT COUNT(*) FROM quotes WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now','localtime')"
        ).fetchone()[0]
        last_backup = self.get_setting("last_backup", "") or ""
        return {
            "total_quotes": int(total_quotes),
            "total_value": float(total_value),
            "this_month": int(this_month),
            "last_backup": last_backup,
        }

    def close(self) -> None:
        self.conn.close()
