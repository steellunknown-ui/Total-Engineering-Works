from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base

class RFQ(Base):
    __tablename__ = "rfqs"

    id = Column(Integer, primary_key=True, index=True)
    rfq_number = Column(String, unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    project_description = Column(Text, nullable=True)
    status = Column(String, default="Pending Review", nullable=False)
    
    # Phase 8: Instant Estimate Fields
    lead_source = Column(String, server_default="Manual Upload", nullable=False)
    material = Column(String, nullable=True)
    thickness = Column(Float, nullable=True)
    quantity = Column(Integer, nullable=True)
    estimate_min = Column(Float, nullable=True)
    estimate_max = Column(Float, nullable=True)
    estimate_date = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", backref="rfqs")
    files = relationship("RFQFile", backref="rfq", cascade="all, delete-orphan")

class RFQFile(Base):
    __tablename__ = "rfq_files"

    id = Column(Integer, primary_key=True, index=True)
    rfq_id = Column(Integer, ForeignKey("rfqs.id"), nullable=False)
    file_name = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    # Storage Retention
    storage_status = Column(String, default="active", nullable=False)
    archived_at = Column(DateTime, nullable=True)
    archived_reason = Column(String, nullable=True)

