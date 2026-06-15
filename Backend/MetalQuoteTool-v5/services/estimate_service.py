from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.setting import Setting
from schemas.quote_schema import EstimateRequest, EstimateResponse, EstimateItemResponse

def get_settings(db: Session) -> dict:
    settings = db.query(Setting).all()
    return {s.key: s.value for s in settings}

def _get_setting_or_fail(settings: dict, key: str) -> float:
    if key not in settings:
        raise HTTPException(status_code=400, detail=f"Missing required pricing setting: {key}")
    return settings[key]

def generate_estimate(db: Session, request: EstimateRequest) -> EstimateResponse:
    """
    Calculates the detailed cost estimate for a list of FAB sheet items.
    """
    settings = get_settings(db)
    
    # Required keys
    markup_pct = _get_setting_or_fail(settings, "material_markup_percent")
    default_margin_pct = _get_setting_or_fail(settings, "default_margin_percent")
    gst_pct = _get_setting_or_fail(settings, "gst_percent")
    
    laser_rate = _get_setting_or_fail(settings, "laser_cutting_rate")
    bending_rate = _get_setting_or_fail(settings, "bending_rate")
    welding_rate = _get_setting_or_fail(settings, "welding_rate")
    machining_rate = _get_setting_or_fail(settings, "machining_rate")
    labour_rate = _get_setting_or_fail(settings, "labour_rate")
    weight_multiplier = _get_setting_or_fail(settings, "weight_rate_multiplier")

    items = []
    subtotal = 0.0

    for part in request.items:
        # Cost calculations
        # Material Cost: (weight * multiplier) * (1 + markup)
        base_material_cost = (part.weight * weight_multiplier)
        material_cost = base_material_cost * (1 + (markup_pct / 100.0))
        
        # Operational costs
        cutting_cost = part.perim_mm * laser_rate
        bending_cost = part.bend_count * bending_rate
        welding_cost = part.welding_time * welding_rate
        machining_cost = part.machining_time * machining_rate
        labour_cost = part.labour_time * labour_rate

        # Per part total
        part_total = material_cost + cutting_cost + bending_cost + welding_cost + machining_cost + labour_cost

        # Multiply by quantity for the quote subtotal contribution
        line_total = part_total * part.quantity
        subtotal += line_total

        items.append(EstimateItemResponse(
            part_name=part.part_name,
            material=part.material,
            thickness=part.thickness,
            quantity=part.quantity,
            weight=part.weight,
            material_cost=round(material_cost, 2),
            cutting_cost=round(cutting_cost, 2),
            bending_cost=round(bending_cost, 2),
            welding_cost=round(welding_cost, 2),
            machining_cost=round(machining_cost, 2),
            labour_cost=round(labour_cost, 2),
            part_total=round(part_total, 2),
            line_total=round(line_total, 2),
            rfq_file_id=part.rfq_file_id,
            geometry_svg=part.geometry_svg,
        ))

    # Apply margins
    margin_amount = subtotal * (default_margin_pct / 100.0)
    pre_tax_total = subtotal + margin_amount
    gst_amount = pre_tax_total * (gst_pct / 100.0)
    grand_total = pre_tax_total + gst_amount

    # Build snapshot
    snapshots = {
        "material_rate_snapshot": weight_multiplier,
        "laser_rate_snapshot": laser_rate,
        "bending_rate_snapshot": bending_rate,
        "welding_rate_snapshot": welding_rate,
        "machining_rate_snapshot": machining_rate,
        "labour_rate_snapshot": labour_rate,
        "margin_snapshot": default_margin_pct,
        "gst_snapshot": gst_pct
    }

    return EstimateResponse(
        subtotal=round(subtotal, 2),
        margin_amount=round(margin_amount, 2),
        gst_amount=round(gst_amount, 2),
        grand_total=round(grand_total, 2),
        items=items,
        snapshots=snapshots
    )
