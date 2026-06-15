# ═══════════════════════════════════════════════════════════════
#  §2  BENCHMARK DATA
# ═══════════════════════════════════════════════════════════════

MATERIALS = ["CRCA", "CR Sheet", "HR Sheet", "MS Sheet", "GI Sheet"]
DENSITY = {"CRCA":7850, "CR Sheet":7850, "HR Sheet":7850, "MS Sheet":7850, "GI Sheet":7850}

STANDARD_SHEETS = {
    "1220 × 2440  (4'×8')":   (1220, 2440),
    "1250 × 2500  (Metric)":  (1250, 2500),
    "1000 × 2000  (Small)":   (1000, 2000),
    "1300 × 3000  (Oversize)":(1300, 3000),
    "1500 × 3000  (Large)":   (1500, 3000),
    "1524 × 3048  (5'×10')":  (1524, 3048),
}

# Fallback sheet name for parts whose L × W exceeds the default
# 1220 × 2440. Used by `_pick_sheet_for_part()` whenever the auto-
# assigned default can't accommodate the part in either orientation.
DEFAULT_OVERSIZE_SHEET = "1300 × 3000  (Oversize)"
DEFAULT_SHEET = "1220 × 2440  (4'×8')"


def pick_sheet_for_part(length: float | None,
                          width: float | None) -> str:
    """Pick the right sheet for a part:
       • Default = 1220 × 2440 (the operator's normal working stock)
       • If the part doesn't fit 1220 × 2440 in either orientation
         → 1300 × 3000 (oversize stock)

    Other STANDARD_SHEETS entries are alternatives the operator can
    pick MANUALLY from the dropdown — we never auto-downgrade a part
    onto a smaller sheet just because it would technically fit there.
    """
    if length is None or width is None or length <= 0 or width <= 0:
        return DEFAULT_SHEET
    sl, sw = STANDARD_SHEETS[DEFAULT_SHEET]
    fits_default = (length <= sl and width <= sw) or \
                   (length <= sw and width <= sl)
    return DEFAULT_SHEET if fits_default else DEFAULT_OVERSIZE_SHEET

# Rate bands calibrated to India market, April 2026 (₹/kg, low–high).
# Sources: tatanexarc daily steel rates, IndiaMART trader listings, ferrite/
# anand steel wholesalers. Thinner gauges carry a processing premium; CR
# carries ₹8–12/kg over HR; CRCA adds ~₹2–4/kg over CR for annealing;
# GI adds coating premium that scales up with thinness.
RATE_BANDS = {
    "CRCA":     [(0.8,62,68),(1.0,60,66),(1.5,58,64),(2.0,57,63),(2.5,57,62),(3.0,56,61)],
    "CR Sheet": [(0.8,60,66),(1.0,59,65),(1.5,57,63),(2.0,56,62),(2.5,56,61),(3.0,55,60)],
    "HR Sheet": [(0.8,52,56),(1.0,51,55),(1.5,49,53),(2.0,48,52),(2.5,48,52),(3.0,47,51)],
    "MS Sheet": [(0.8,56,60),(1.0,54,58),(1.5,52,56),(2.0,52,56),(2.5,51,55),(3.0,50,54)],
    "GI Sheet": [(0.8,68,82),(1.0,66,80),(1.5,64,78),(2.0,63,76),(2.5,62,74),(3.0,60,72)],
}

THICKNESSES = {
    "CRCA":     [0.8,1.0,1.5,2.0,2.5,3.0],
    "CR Sheet": [0.8,1.0,1.5,2.0,2.5,3.0],
    "HR Sheet": [0.8,1.0,1.5,2.0,2.5,3.0],
    "MS Sheet": [0.8,1.0,1.5,2.0,2.5,3.0],
    "GI Sheet": [0.8,1.0,1.5,2.0,2.5,3.0],
}

SURFACES = {"None":0,"Powder Coating":350,"Zinc Plating":280,"Anodizing":450,
            "Chrome Plating":600,"Paint (Primer)":150,"Paint (Enamel)":250,
            "Passivation":200,"Hot-Dip Galvanize":320}

# MEPL Standard RM Rate Format — flat ₹/kg of part weight. When an operation
# is triggered (holes>0, bends>0, weld>0, or a per-kg surface is selected),
# the engine uses these rates instead of granular per-feature formulas.
STD_RATES_PER_KG = {
    "punching":             6.00,
    "bending":              3.00,
    "welding":              4.00,
    "powder_coating_dual": 24.80,
}

# ── MATERIAL RATE BANDS ───────────────────────────────────────
#
# Source: Steel_Rate_Card_Nashik_Apr2026.xlsx (14 Apr 2026).
# All rates are LANDED ₹/kg, ex-GST, Nashik freight included.
#
# Each entry maps a material → list of (thickness_max_mm, low_rate,
# high_rate) tuples. The lookup picks the FIRST entry whose
# thickness_max ≥ part_thickness, so band breakpoints are upper bounds.
#
# To get the customer-quote rate, optionally pass a buffer % (default 0)
# (30% buffer covers freight variation, yield loss, brand premium,
# small-qty surcharge, and credit terms).
MATERIAL_RATE_BANDS = {
    # CRCA — IS 513, available 0.5-3.0 mm
    "CRCA": [
        (1.0, 60, 64),     # 1.0 mm
        (2.0, 59, 63),     # 1.5-2.0 mm
        (3.0, 58, 62),     # 2.5-3.0 mm
    ],
    # HR Sheet — IS 2062 E250
    "HR Sheet": [
        (4.0, 51, 54),     # 1.5-4.0 mm sheet metal
        (6.0, 65, 70),     # 5.0-6.0 mm structural
        (9.0, 64, 69),     # 7.0-9.0 mm heavy plate
    ],
    # MS Sheet — same IS 2062 spec as HR (alternate trade name)
    "MS Sheet": [
        (4.0, 51, 54),
        (6.0, 65, 70),
        (9.0, 64, 69),
    ],
    # CR Sheet — same as CRCA minus annealing premium
    "CR Sheet": [
        (1.0, 58, 62),
        (2.0, 57, 61),
        (3.0, 56, 60),
    ],
    # GI Sheet — IS 277 Z275, zinc-coating premium scales with thinness
    "GI Sheet": [
        (0.5, 65, 72),
        (1.0, 67, 76),
        (2.0, 70, 80),
    ],
    # Stainless / aluminium — single-band fallbacks (commodity rates)
    "SS-304":     [(99.0, 215, 230)],
    "SS-316":     [(99.0, 330, 360)],
    "Stainless Steel": [(99.0, 215, 230)],
    "Aluminium":  [(99.0, 230, 260)],
}

# Buffer % over the landed rate — applied to the customer-quote rate.
# DEFAULT = 0 (no markup); the operator can dial it up in the Quote
# Preview if they want to add freight/credit/brand premium etc.
QUOTE_BUFFER_DEFAULT_PCT = 0


def material_rate(material: str, thickness: float | None,
                    buffer_pct: float = 0.0) -> float | None:
    """Return the ₹/kg rate for a (material, thickness) pair.

    • `buffer_pct=0`  → landed mid-rate (default — no markup)
    • `buffer_pct=30` → landed × 1.30 (typical customer-quote rate)
    • Any positive number adds that percent over the landed rate.

    Falls back to None when the material isn't in the bands table.
    Falls back to the LAST band's rate when the thickness exceeds the
    biggest band (so a 12 mm HR plate uses the heavy-plate rate)."""
    if not material:
        return None
    bands = MATERIAL_RATE_BANDS.get(material)
    if not bands:
        return None
    if thickness is None:
        thickness = 1.5     # safe-default sheet-metal gauge
    # Pick first band whose upper bound ≥ thickness.
    chosen = None
    for thk_max, lo, hi in bands:
        if thickness <= thk_max:
            chosen = (lo, hi); break
    if chosen is None:
        chosen = (bands[-1][1], bands[-1][2])
    mid = (chosen[0] + chosen[1]) / 2.0
    multiplier = 1.0 + (buffer_pct or 0) / 100.0
    return round(mid * multiplier, 2)


def material_rate_band(material: str, thickness: float | None
                         ) -> tuple[float, float] | None:
    """Return the (low, high) landed-rate band for a (material, thk)
    pair — useful for displaying the rate range to the operator."""
    if not material:
        return None
    bands = MATERIAL_RATE_BANDS.get(material)
    if not bands:
        return None
    if thickness is None:
        thickness = 1.5
    for thk_max, lo, hi in bands:
        if thickness <= thk_max:
            return (float(lo), float(hi))
    return (float(bands[-1][1]), float(bands[-1][2]))


# ── Legacy flat lookup (kept for backwards compat with quote_engine.py) ──
# Each value is the customer-quote rate for the most common gauge.
MATERIAL_RATE_PER_KG = {
    mat: material_rate(mat, 2.0) or 0
    for mat in MATERIAL_RATE_BANDS
}


def full_process_rate_crca() -> float:
    """Sum of every operation rate + CRCA material rate at 2 mm.
    Used to verify the rate-format card matches the operator's STD RM
    spreadsheet ('Total: 105.80 ₹/kg' for CRCA at 2 mm)."""
    return (STD_RATES_PER_KG["punching"]
            + STD_RATES_PER_KG["bending"]
            + STD_RATES_PER_KG["welding"]
            + STD_RATES_PER_KG["powder_coating_dual"]
            + (material_rate("CRCA", 2.0) or 0))


# Per-kg surfaces: name → key in STD_RATES_PER_KG. Checked before SURFACES.
SURFACES_PER_KG = {
    "Powder Coating (Dual Shade)": "powder_coating_dual",
}

K_FACTOR = {"CRCA":0.33,"CR Sheet":0.33,"HR Sheet":0.33,"MS Sheet":0.33,"GI Sheet":0.33}
OP_MULT  = {"CRCA":1.0,"CR Sheet":1.0,"HR Sheet":1.0,"MS Sheet":1.0,"GI Sheet":1.1}


def load_overrides(db):
    """Load user-overridden values from DB settings table, falling back to
    module defaults when no row exists. Mutates module-level dicts in place.
    """
    global RATE_BANDS, STANDARD_SHEETS, SURFACES, STD_RATES_PER_KG
    global MATERIAL_RATE_PER_KG
    rb = db.get_setting("rate_bands", None)
    if rb is not None:
        # Stored as {material: [[t,lo,hi], ...]}; convert back to tuples.
        RATE_BANDS.clear()
        for mat, rows in rb.items():
            RATE_BANDS[mat] = [tuple(r) for r in rows]
    ss = db.get_setting("standard_sheets", None)
    if ss is not None:
        STANDARD_SHEETS.clear()
        for name, dims in ss.items():
            STANDARD_SHEETS[name] = tuple(dims)
    sf = db.get_setting("surfaces", None)
    if sf is not None:
        SURFACES.clear()
        SURFACES.update(sf)
    pr = db.get_setting("std_rates_per_kg", None)
    if pr is not None:
        STD_RATES_PER_KG.update(pr)
    mr = db.get_setting("material_rate_per_kg", None)
    if mr is not None:
        MATERIAL_RATE_PER_KG.update(mr)
