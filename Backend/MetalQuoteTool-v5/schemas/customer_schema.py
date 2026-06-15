from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── Customer list item (with computed stats) ──────────────────────────────────

class CustomerListItem(BaseModel):
    id: int
    company_name: str
    contact_person: str
    email: str
    phone: Optional[str]
    website: Optional[str]
    lead_source: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    # Computed analytics
    rfq_count: int = 0
    quote_count: int = 0
    accepted_count: int = 0
    rejected_count: int = 0
    total_revenue: float = 0.0
    avg_quote_value: float = 0.0
    conversion_rate: float = 0.0
    last_activity: Optional[datetime] = None

    class Config:
        from_attributes = True


class CustomerListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    customers: List[CustomerListItem]


# ── Customer detail (with history) ───────────────────────────────────────────

class CustomerRFQItem(BaseModel):
    id: int
    rfq_number: str
    status: str
    lead_source: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerQuoteItem(BaseModel):
    id: int
    quote_number: str
    status: str
    grand_total: float
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerDetailResponse(BaseModel):
    id: int
    company_name: str
    contact_person: str
    email: str
    phone: Optional[str]
    website: Optional[str]
    lead_source: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    # Analytics
    rfq_count: int
    quote_count: int
    accepted_count: int
    rejected_count: int
    total_revenue: float
    avg_quote_value: float
    conversion_rate: float
    last_rfq_date: Optional[datetime]
    last_quote_date: Optional[datetime]
    most_used_material: Optional[str]
    most_used_thickness: Optional[float]

    # History
    rfqs: List[CustomerRFQItem] = []
    quotes: List[CustomerQuoteItem] = []


# ── Create / Update ───────────────────────────────────────────────────────────

class CustomerCreate(BaseModel):
    company_name: str
    contact_person: str
    email: str
    phone: Optional[str] = None
    website: Optional[str] = None
    lead_source: Optional[str] = "Manual Entry"
    notes: Optional[str] = None


class CustomerUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    lead_source: Optional[str] = None
    notes: Optional[str] = None
