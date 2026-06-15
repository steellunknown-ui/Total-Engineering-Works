from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import io
import tempfile
import shutil
from fastapi.responses import StreamingResponse
from xhtml2pdf import pisa
import openpyxl

from core.database import get_db
from models.customer import Customer
from models.rfq import RFQ, RFQFile
from models.setting import Setting
from services.rfq_number_service import generate_rfq_number
from services.storage_service import upload_rfq_file
from core.cad_reader import read_cad
from core.calc import wt
from datetime import datetime

router = APIRouter(prefix="/api/public", tags=["Public"])

ALLOWED_EXTENSIONS = {".pdf", ".dxf", ".dwg", ".step", ".stp", ".zip"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB per file

@router.post("/rfq")
async def submit_public_rfq(
    company_name: str = Form(...),
    contact_person: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    project_description: Optional[str] = Form(None),
    material: Optional[str] = Form(None),
    thickness: Optional[float] = Form(None),
    quantity: Optional[int] = Form(None),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    Public endpoint for customers to submit an RFQ.
    Receives multipart/form-data with customer details and CAD/PDF files.
    """
    
    # 1. Validate Files before doing any DB work
    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"File type {ext} not allowed for {file.filename}.")
            
        # We can't perfectly check size before reading, but we can rely on standard 
        # fastapi/starlette upload limits or read lengths. For now, we trust the proxy limits,
        # but the business rule is clear on allowed extensions.

    # 2. Customer Deduplication Logic (Mandatory Architectural Requirement)
    customer = db.query(Customer).filter(
        (Customer.email == email) | (Customer.company_name == company_name)
    ).first()

    if not customer:
        customer = Customer(
            company_name=company_name,
            contact_person=contact_person,
            email=email,
            phone=phone
        )
        db.add(customer)
        db.flush() # flush to get customer.id

    # 3. Generate RFQ Number
    rfq_number = generate_rfq_number(db)

    # 4. Create RFQ Record
    rfq = RFQ(
        rfq_number=rfq_number,
        customer_id=customer.id,
        project_description=project_description,
        status="Pending Review",
        lead_source="Instant Estimate" if material and thickness else "Manual Upload",
        material=material,
        thickness=thickness,
        quantity=quantity,
        estimate_date=datetime.utcnow() if material else None
    )
    db.add(rfq)
    db.flush()

    # 5. Upload Files to Supabase Storage & Create RFQFile Records
    rfq_files_list = []
    temp_paths = []

    for file in files:
        try:
            ext = os.path.splitext(file.filename)[1].lower()
            fd, path = tempfile.mkstemp(suffix=ext)
            with open(path, "wb") as f:
                shutil.copyfileobj(file.file, f)
            os.close(fd)
            temp_paths.append(path)
            
            await file.seek(0)
            storage_path = await upload_rfq_file(file, rfq_number)
            
            rfq_file = RFQFile(
                rfq_id=rfq.id,
                file_name=file.filename,
                storage_path=storage_path,
                file_type=ext
            )
            db.add(rfq_file)
            rfq_files_list.append(rfq_file)
        except Exception as e:
            for p in temp_paths:
                try: os.remove(p)
                except: pass
            db.rollback() # Rollback if any file upload fails
            raise HTTPException(status_code=500, detail=f"Failed to process file {file.filename}: {str(e)}")

    db.flush()

    # 6. Calculate Approximate Estimate (Phase 8)
    estimate_min = None
    estimate_max = None
    material_ratio = 0.60  # default 60% if calculation fails
    
    if material and thickness and quantity and quantity > 0:
        settings = {s.key: s.value for s in db.query(Setting).all()}
        weight_multiplier = float(settings.get("weight_rate_multiplier", 100))
        markup_pct = float(settings.get("material_markup_percent", 20))
        laser_rate = float(settings.get("laser_cutting_rate", 35))
        margin_pct = float(settings.get("default_margin_percent", 15))
        
        total_mfg_cost = 0.0
        total_mat_cost = 0.0
        
        for rf, t_path in zip(rfq_files_list, temp_paths):
            if rf.file_type in [".dxf", ".dwg", ".step", ".stp", ".iges", ".igs"]:
                try:
                    cad_data = read_cad(t_path)
                    if cad_data:
                        # Calculate weight
                        length = float(cad_data.get("length", 0) or 0)
                        width = float(cad_data.get("width", 0) or 0)
                        part_weight = wt(material, length, width, thickness)
                        
                        # Material cost
                        base_mat_cost = part_weight * weight_multiplier
                        mat_cost = base_mat_cost * (1 + (markup_pct / 100.0))
                        
                        # Laser cost
                        perim = float(cad_data.get("cut", 0) or 0)
                        cutting_cost = perim * laser_rate
                        
                        # Part total
                        total_mat_cost += (mat_cost * quantity)
                        part_total = mat_cost + cutting_cost
                        total_mfg_cost += (part_total * quantity)
                except Exception:
                    pass
        
        if total_mfg_cost > 0:
            pre_tax = total_mfg_cost * (1 + (margin_pct / 100.0))
            # Create a +/- 15% range
            estimate_min = round(pre_tax * 0.85, 2)
            estimate_max = round(pre_tax * 1.15, 2)
            rfq.estimate_min = estimate_min
            rfq.estimate_max = estimate_max
            material_ratio = total_mat_cost / total_mfg_cost

    for p in temp_paths:
        try: os.remove(p)
        except: pass

    # 7. Commit transaction
    db.commit()

    return {
        "success": True,
        "rfq_number": rfq_number,
        "estimate_min": estimate_min,
        "estimate_max": estimate_max,
        "material_ratio": material_ratio
    }

@router.get("/estimate/{rfq_number}/xlsx")
def export_estimate_xlsx(rfq_number: str, db: Session = Depends(get_db)):
    rfq = db.query(RFQ).filter(RFQ.rfq_number == rfq_number).first()
    if not rfq or not rfq.estimate_min:
        raise HTTPException(status_code=404, detail="Estimate not found")

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Instant Estimate"

    ws.append(["Instant Estimate Summary", "", "NOT A FINAL QUOTATION"])
    ws.append([])
    ws.append(["RFQ Number", rfq.rfq_number])
    ws.append(["Date", str(rfq.estimate_date)])
    ws.append(["Material", rfq.material])
    ws.append(["Thickness (mm)", rfq.thickness])
    ws.append(["Quantity", rfq.quantity])
    ws.append(["Estimated Min (INR)", rfq.estimate_min])
    ws.append(["Estimated Max (INR)", rfq.estimate_max])

    out = io.BytesIO()
    wb.save(out)
    out.seek(0)
    return StreamingResponse(
        out, 
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=Estimate_{rfq_number}.xlsx"}
    )

@router.get("/estimate/{rfq_number}/pdf")
def export_estimate_pdf(rfq_number: str, db: Session = Depends(get_db)):
    rfq = db.query(RFQ).filter(RFQ.rfq_number == rfq_number).first()
    if not rfq or not rfq.estimate_min:
        raise HTTPException(status_code=404, detail="Estimate not found")

    html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Helvetica, sans-serif; padding: 20px; }}
            h1 {{ color: #333; }}
            .disclaimer {{ color: red; font-weight: bold; border: 1px solid red; padding: 10px; margin-bottom: 20px; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
            th {{ background-color: #f2f2f2; }}
        </style>
    </head>
    <body>
        <div class="disclaimer">NOT A FINAL QUOTATION - APPROXIMATE ESTIMATE ONLY</div>
        <h1>Instant Estimate: {rfq.rfq_number}</h1>
        <table>
            <tr><th>Date</th><td>{rfq.estimate_date}</td></tr>
            <tr><th>Material</th><td>{rfq.material}</td></tr>
            <tr><th>Thickness</th><td>{rfq.thickness} mm</td></tr>
            <tr><th>Quantity</th><td>{rfq.quantity}</td></tr>
            <tr><th>Estimated Range (INR)</th><td>{rfq.estimate_min:,.2f} - {rfq.estimate_max:,.2f}</td></tr>
        </table>
    </body>
    </html>
    """

    buf = io.BytesIO()
    pisa.CreatePDF(io.StringIO(html), dest=buf, encoding="utf-8")
    buf.seek(0)
    
    return StreamingResponse(
        buf, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Estimate_{rfq_number}.pdf"}
    )


# ─── Phase 8.5: Public Materials Endpoint (for Instant Estimate widget) ──────

@router.get("/materials")
def get_public_materials(db: Session = Depends(get_db)):
    """
    Returns active materials and their active thicknesses.
    No auth required — consumed by the public Instant Estimate widget.
    Falls back to constants.py if DB has no materials seeded yet.
    """
    from models.material import Material, MaterialThickness
    from data.constants import MATERIALS as CONST_MATERIALS, THICKNESSES as CONST_THICKNESSES, DENSITY as CONST_DENSITY

    db_materials = (
        db.query(Material)
        .filter(Material.active == True)
        .order_by(Material.name)
        .all()
    )

    if db_materials:
        result = []
        for mat in db_materials:
            thicknesses = sorted([
                t.thickness_mm for t in mat.thicknesses if t.active
            ])
            result.append({
                "name": mat.name,
                "density": mat.density,
                "thicknesses": thicknesses,
            })
        return result

    # Fallback to constants.py
    result = []
    for mat in CONST_MATERIALS:
        result.append({
            "name": mat,
            "density": CONST_DENSITY.get(mat, 7850),
            "thicknesses": CONST_THICKNESSES.get(mat, []),
        })
    return result
