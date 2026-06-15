"""Unit tests for data/db.py — must pass before any UI work."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest

# Allow `from data.db import ...` when tests are run from the project root.
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from data.db import QuoteDB, quote_to_json, quote_from_json   # noqa: E402
from core.quote_engine import gen_quote                       # noqa: E402


@pytest.fixture
def db(tmp_path):
    path = tmp_path / "quotes.sqlite"
    d = QuoteDB(db_path=path)
    yield d
    d.close()


def _fresh_quote(name="Part A", mat="CRCA", t=1.0, pl=300, pw=200, qty=100,
                 n_bends=2, b_len=300, n_holes=4, h_dia=10):
    return gen_quote(
        name=name, mat=mat, t=t, pl=pl, pw=pw, qty=qty, slider=50,
        cut_m="laser", cut_p=0, int_c=0, n_bends=n_bends, b_len=b_len,
        n_holes=n_holes, h_dia=h_dia, w_type="mig", w_len=0, n_spots=0,
        surface="None", oh_pct=15, pr_pct=20,
    )


def test_schema_creates(db):
    tables = {r[0] for r in db.conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'").fetchall()}
    assert {"quotes", "quote_lines", "batches", "batch_items", "settings"} <= tables

    indexes = {r[0] for r in db.conn.execute(
        "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'").fetchall()}
    assert {
        "idx_quotes_customer", "idx_quotes_created", "idx_quotes_material",
        "idx_quotes_status", "idx_lines_quote",
    } <= indexes


def test_quote_no_sequence(db):
    from datetime import datetime
    year = datetime.now().year
    ids = [db.save_quote(_fresh_quote(name=f"P{i}")) for i in range(3)]
    nos = [db.conn.execute(
        "SELECT quote_no FROM quotes WHERE id=?", (i,)).fetchone()[0] for i in ids]
    assert nos == [f"MQ-{year}-0001", f"MQ-{year}-0002", f"MQ-{year}-0003"]


def test_save_load_roundtrip(db):
    q = _fresh_quote()
    qid = db.save_quote(q, customer="Acme Ltd", cad_file="/tmp/foo.dxf")
    loaded = db.load_quote(qid)

    assert loaded.name == q.name
    assert loaded.mat == q.mat
    assert loaded.t == q.t
    assert loaded.pl == q.pl
    assert loaded.pw == q.pw
    assert loaded.qty == q.qty
    assert loaded.total == q.total
    assert loaded.sub == q.sub
    assert len(loaded.lines) == len(q.lines)
    for a, b in zip(loaded.lines, q.lines):
        assert a.desc == b.desc and a.amt == b.amt and a.qty == b.qty
    if q.n is not None:
        assert loaded.n is not None
        assert loaded.n.best == q.n.best
        assert loaded.n.util == q.n.util


def test_list_filters(db):
    q1 = db.save_quote(_fresh_quote(name="P1", mat="CRCA"), customer="Acme")
    q2 = db.save_quote(_fresh_quote(name="P2", mat="GI Sheet"), customer="Acme")
    q3 = db.save_quote(_fresh_quote(name="P3", mat="CRCA"), customer="Beta Co")
    q4 = db.save_quote(_fresh_quote(name="P4", mat="CRCA"), customer="Beta Co")
    db.update_status(q2, "sent")
    db.update_status(q3, "accepted")

    assert len(db.list_quotes(customer="Acme")) == 2
    assert len(db.list_quotes(material="CRCA")) == 3
    assert len(db.list_quotes(status="sent")) == 1
    assert len(db.list_quotes(status="accepted")) == 1
    results = db.list_quotes(search="P3")
    assert len(results) == 1 and results[0]["part_name"] == "P3"


def test_delete_cascades(db):
    q = _fresh_quote()  # has material + cutting + bending + punching = 4 lines
    qid = db.save_quote(q)
    before = db.conn.execute(
        "SELECT COUNT(*) FROM quote_lines WHERE quote_id = ?", (qid,)).fetchone()[0]
    assert before == len(q.lines) and before >= 3
    db.delete_quote(qid)
    after = db.conn.execute(
        "SELECT COUNT(*) FROM quote_lines WHERE quote_id = ?", (qid,)).fetchone()[0]
    assert after == 0


def test_settings_roundtrip(db):
    db.set_setting("overhead_pct", 15)
    db.set_setting("cfg", {"a": 1, "b": [2, 3]})
    assert db.get_setting("overhead_pct") == 15
    assert db.get_setting("cfg") == {"a": 1, "b": [2, 3]}
    assert db.get_setting("missing", "fallback") == "fallback"

    db.set_setting("overhead_pct", 22)
    assert db.get_setting("overhead_pct") == 22


def test_stats(db):
    totals = [_fresh_quote(name=f"P{i}").total for i in range(3)]
    for i in range(3):
        db.save_quote(_fresh_quote(name=f"P{i}"))
    s = db.stats()
    assert s["total_quotes"] == 3
    assert s["this_month"] == 3
    assert abs(s["total_value"] - sum(totals)) < 0.01


def test_save_batch(db):
    quotes = [_fresh_quote(name=f"P{i}") for i in range(3)]
    batch_id = db.save_batch(quotes, customer="Acme", note="Monthly run")
    row = db.conn.execute(
        "SELECT batch_no, customer, total FROM batches WHERE id = ?", (batch_id,)
    ).fetchone()
    assert row["customer"] == "Acme"
    assert abs(row["total"] - sum(q.total for q in quotes)) < 0.01
    items = db.conn.execute(
        "SELECT COUNT(*) FROM batch_items WHERE batch_id = ?", (batch_id,)
    ).fetchone()[0]
    assert items == 3
