from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from datetime import datetime
from core.database import Base


class SurfaceFinish(Base):
    """
    Surface finishing processes and their rates.

    Replaces the SURFACES dict in data/constants.py.
    Owner can add / edit / soft-delete finishing processes from Settings UI
    without any code changes.
    """
    __tablename__ = "surface_finishes"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, unique=True, nullable=False, index=True)
    rate        = Column(Float, nullable=False)       # ₹ — interpretation depends on unit
    unit        = Column(String, nullable=False, default="₹/sqm")
    active      = Column(Boolean, nullable=False, default=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by  = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by  = Column(Integer, ForeignKey("users.id"), nullable=True)
