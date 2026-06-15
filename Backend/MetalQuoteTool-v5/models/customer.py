from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from core.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id             = Column(Integer, primary_key=True, index=True)
    company_name   = Column(String, index=True, nullable=False)
    contact_person = Column(String, nullable=False)
    email          = Column(String, unique=True, index=True, nullable=False)
    phone          = Column(String, nullable=True)

    # Phase 8.5 additions — all nullable for backward compatibility
    website        = Column(String, nullable=True)
    lead_source    = Column(String, nullable=True, default="Manual Entry")
    notes          = Column(Text, nullable=True)

    created_at     = Column(DateTime, default=datetime.utcnow)
    updated_at     = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
