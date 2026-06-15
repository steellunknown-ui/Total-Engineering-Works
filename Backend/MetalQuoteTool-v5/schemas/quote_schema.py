from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class EstimateRequestItem(BaseModel):
    part_name: str
    material: str
    thickness: float
    quantity: int
    weight: float
    perim_mm: float = 0.0
    bend_count: int = 0
    welding_time: float = 0.0
    machining_time: float = 0.0
    labour_time: float = 0.0
    rfq_file_id: Optional[int] = None
    geometry_svg: Optional[str] = None


class EstimateRequest(BaseModel):
    items: List[EstimateRequestItem]


class EstimateItemResponse(BaseModel):
    part_name: str
    material: str
    thickness: float
    quantity: int
    weight: float
    material_cost: float
    cutting_cost: float
    bending_cost: float
    welding_cost: float
    machining_cost: float
    labour_cost: float
    part_total: float
    line_total: float
    rfq_file_id: Optional[int] = None
    geometry_svg: Optional[str] = None


class EstimateResponse(BaseModel):
    subtotal: float
    margin_amount: float
    gst_amount: float
    grand_total: float
    items: List[EstimateItemResponse]
    snapshots: dict


class CreateQuoteRequest(BaseModel):
    rfq_id: int
    customer_id: int
    notes: Optional[str] = None
    estimate: EstimateResponse


class QuoteHistoryItem(BaseModel):
    id: int
    quote_number: str
    rfq_number: str
    customer_name: str
    status: str
    grand_total: float
    created_by_name: Optional[str]
    created_at: datetime
    # Phase 7A: PDF metadata
    pdf_storage_path:  Optional[str]      = None
    pdf_version:       Optional[int]      = None
    pdf_generated_at:  Optional[datetime] = None


class QuoteHistoryResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    quotes: List[QuoteHistoryItem]


class QuoteStatusUpdateRequest(BaseModel):
    new_status: str
    notes: Optional[str] = None


# ── Phase 7A: PDF generation response schemas ──────────────────────────────────

class PdfGenerateResponse(BaseModel):
    quote_id:        int
    quote_number:    str
    signed_url:      str
    version:         int
    generated_at:    str
    quality_status:  str          # "PASS" | "WARN" | "FAIL"
    warnings:        List[str] = []


class PdfUrlResponse(BaseModel):
    signed_url:          str
    version:             Optional[int]
    generated_at:        Optional[str]
    expires_in_seconds:  int = 300
