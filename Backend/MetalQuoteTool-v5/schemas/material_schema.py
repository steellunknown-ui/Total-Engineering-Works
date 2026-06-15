from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── Material Thickness ────────────────────────────────────────────────────────

class MaterialThicknessItem(BaseModel):
    id: int
    material_id: int
    thickness_mm: float
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MaterialThicknessCreate(BaseModel):
    material_id: int
    thickness_mm: float


class MaterialThicknessUpdate(BaseModel):
    thickness_mm: Optional[float] = None
    active: Optional[bool] = None


# ── Material ──────────────────────────────────────────────────────────────────

class MaterialItem(BaseModel):
    id: int
    name: str
    density: float
    active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    thicknesses: List[MaterialThicknessItem] = []

    class Config:
        from_attributes = True


class MaterialCreate(BaseModel):
    name: str
    density: float = 7850.0
    active: bool = True


class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    density: Optional[float] = None
    active: Optional[bool] = None


# ── Material Rate Band ────────────────────────────────────────────────────────

class MaterialRateBandItem(BaseModel):
    id: int
    material_name: str
    thickness_min: float
    thickness_max: float
    rate_low: float
    rate_high: float
    active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class MaterialRateBandCreate(BaseModel):
    material_name: str
    thickness_min: float = 0.0
    thickness_max: float
    rate_low: float
    rate_high: float


class MaterialRateBandUpdate(BaseModel):
    material_name: Optional[str] = None
    thickness_min: Optional[float] = None
    thickness_max: Optional[float] = None
    rate_low: Optional[float] = None
    rate_high: Optional[float] = None
    active: Optional[bool] = None


# ── Surface Finish ────────────────────────────────────────────────────────────

class SurfaceFinishItem(BaseModel):
    id: int
    name: str
    rate: float
    unit: str
    active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class SurfaceFinishCreate(BaseModel):
    name: str
    rate: float
    unit: str = "₹/sqm"
    active: bool = True


class SurfaceFinishUpdate(BaseModel):
    name: Optional[str] = None
    rate: Optional[float] = None
    unit: Optional[str] = None
    active: Optional[bool] = None


# ── Public endpoint shape (no auth, for Instant Estimate) ─────────────────────

class PublicThicknessItem(BaseModel):
    thickness_mm: float

class PublicMaterialItem(BaseModel):
    name: str
    density: float
    thicknesses: List[float] = []

    class Config:
        from_attributes = True
