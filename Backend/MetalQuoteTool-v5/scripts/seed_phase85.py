"""
scripts/seed_phase85.py
========================
Seeds the Phase 8.5 tables from the hardcoded constants in data/constants.py.
Run once after the migration:

    python -m scripts.seed_phase85

Safe to re-run — uses INSERT … ON CONFLICT DO NOTHING.
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from core.database import SessionLocal
# Import all models so SQLAlchemy resolves cross-table FKs (users table)
from models import user, customer, rfq, setting, quote  # noqa: F401
from models.material import Material, MaterialThickness, MaterialRateBand
from models.surface_finish import SurfaceFinish
from data.constants import MATERIAL_RATE_BANDS, THICKNESSES, SURFACES, DENSITY


# ── Reference data ────────────────────────────────────────────────────────────

MATERIAL_DENSITIES = {
    "CRCA":       7850.0,
    "CR Sheet":   7850.0,
    "HR Sheet":   7850.0,
    "MS Sheet":   7850.0,
    "GI Sheet":   7850.0,
    "SS-304":     7930.0,
    "SS-316":     7980.0,
    "Stainless Steel": 7930.0,
    "Aluminium":  2700.0,
}

# Surfaces with their units
SURFACE_UNITS = {
    "None":              "—",
    "Powder Coating":    "₹/sqm",
    "Zinc Plating":      "₹/sqm",
    "Anodizing":         "₹/sqm",
    "Chrome Plating":    "₹/sqm",
    "Paint (Primer)":    "₹/sqm",
    "Paint (Enamel)":    "₹/sqm",
    "Passivation":       "₹/sqm",
    "Hot-Dip Galvanize": "₹/sqm",
}


def seed(db):
    seeded = {"materials": 0, "thicknesses": 0, "rate_bands": 0, "surface_finishes": 0}

    # ── 1. Materials ──────────────────────────────────────────────────────────
    existing_materials = {m.name: m for m in db.query(Material).all()}

    all_material_names = set(MATERIAL_RATE_BANDS.keys()) | set(THICKNESSES.keys())
    for mat_name in sorted(all_material_names):
        if mat_name not in existing_materials:
            density = MATERIAL_DENSITIES.get(mat_name, 7850.0)
            mat = Material(name=mat_name, density=density, active=True)
            db.add(mat)
            seeded["materials"] += 1
            print(f"  [+] Material: {mat_name} ({density} kg/m³)")

    db.flush()  # get IDs

    # ── 2. MaterialThickness ──────────────────────────────────────────────────
    all_materials = {m.name: m for m in db.query(Material).all()}

    for mat_name, thicknesses in THICKNESSES.items():
        mat = all_materials.get(mat_name)
        if not mat:
            continue
        existing_thk = {t.thickness_mm for t in mat.thicknesses}
        for thk in thicknesses:
            if thk not in existing_thk:
                db.add(MaterialThickness(material_id=mat.id, thickness_mm=thk, active=True))
                seeded["thicknesses"] += 1
                print(f"  [+] Thickness: {mat_name} @ {thk}mm")

    # ── 3. MaterialRateBand ───────────────────────────────────────────────────
    for mat_name, bands in MATERIAL_RATE_BANDS.items():
        # Check if any bands already exist for this material
        existing_bands = db.query(MaterialRateBand).filter(
            MaterialRateBand.material_name == mat_name
        ).count()
        if existing_bands > 0:
            continue

        prev_max = 0.0
        for thk_max, lo, hi in bands:
            db.add(MaterialRateBand(
                material_name=mat_name,
                thickness_min=prev_max,
                thickness_max=float(thk_max),
                rate_low=float(lo),
                rate_high=float(hi),
                active=True,
            ))
            seeded["rate_bands"] += 1
            print(f"  [+] RateBand: {mat_name} {prev_max}–{thk_max}mm  ₹{lo}–{hi}/kg")
            prev_max = float(thk_max)

    # ── 4. SurfaceFinish ──────────────────────────────────────────────────────
    existing_surfaces = {s.name for s in db.query(SurfaceFinish).all()}

    for name, rate in SURFACES.items():
        if name == "None":
            continue
        if name not in existing_surfaces:
            unit = SURFACE_UNITS.get(name, "₹/sqm")
            db.add(SurfaceFinish(name=name, rate=float(rate), unit=unit, active=True))
            seeded["surface_finishes"] += 1
            print(f"  [+] SurfaceFinish: {name}  ₹{rate} {unit}")

    db.commit()
    return seeded


if __name__ == "__main__":
    print("Phase 8.5 — Seeding database...")
    db = SessionLocal()
    try:
        results = seed(db)
        print("\n✅ Seeding complete:")
        for k, v in results.items():
            print(f"   {k}: {v} rows inserted")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Seeding failed: {e}")
        raise
    finally:
        db.close()
