from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


# ─── Phase 3: List schemas ────────────────────────────────────────────────────

class RFQListItem(BaseModel):
    """
    A single row in the admin RFQ dashboard table.
    Combines data from the rfqs, customers, and rfq_files tables.
    """
    rfq_id: int
    rfq_number: str
    company_name: str
    contact_person: str
    email: str
    status: str
    created_at: datetime
    file_count: int
    customer_id: int

    class Config:
        from_attributes = True


class RFQListResponse(BaseModel):
    """
    Paginated response envelope for the RFQ list endpoint.
    """
    total: int           # total matching records (for pagination)
    page: int            # current page (1-indexed)
    page_size: int       # records per page
    total_pages: int     # total number of pages
    rfqs: List[RFQListItem]


# ─── Phase 4: Detail schemas ──────────────────────────────────────────────────

class RFQFileDetail(BaseModel):
    """
    An uploaded file record attached to an RFQ.
    storage_path is the internal Supabase path — never returned directly;
    callers use the signed-URL endpoint instead.
    """
    id: int
    file_name: str
    file_type: str          # e.g. ".dxf", ".pdf"
    storage_path: str       # used server-side to generate signed URLs
    uploaded_at: datetime

    class Config:
        from_attributes = True


class RFQCustomerDetail(BaseModel):
    """
    Full customer record embedded in the RFQ detail response.
    """
    id: int
    company_name: str
    contact_person: str
    email: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class RFQDetailResponse(BaseModel):
    """
    Complete RFQ detail — all information needed for the detail page.
    """
    rfq_id: int
    rfq_number: str
    status: str
    project_description: Optional[str] = None
    created_at: datetime
    customer: RFQCustomerDetail
    files: List[RFQFileDetail]
    
    # Phase 8 fields
    lead_source: str
    material: Optional[str] = None
    thickness: Optional[float] = None
    quantity: Optional[int] = None
    estimate_min: Optional[float] = None
    estimate_max: Optional[float] = None
