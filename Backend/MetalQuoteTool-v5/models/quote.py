from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base

class Quote(Base):
    __tablename__ = "quotes_v2"

    id = Column(Integer, primary_key=True, index=True)
    quote_number = Column(String, unique=True, index=True, nullable=False)
    rfq_id = Column(Integer, ForeignKey("rfqs.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)

    subtotal = Column(Float, nullable=False, default=0.0)
    margin_amount = Column(Float, nullable=False, default=0.0)
    gst_amount = Column(Float, nullable=False, default=0.0)
    grand_total = Column(Float, nullable=False, default=0.0)

    status = Column(String, default="Draft", nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # ── Phase 7A: PDF fields ──────────────────────────────────────────────────
    pdf_storage_path = Column(String, nullable=True)   # latest version: e.g. Q-2026-0001-v2.pdf
    pdf_generated_at = Column(DateTime, nullable=True)
    pdf_version      = Column(Integer, nullable=True)  # None = never generated

    # Relationships
    rfq = relationship("RFQ", backref="quotes")
    customer = relationship("Customer", backref="quotes")
    creator = relationship("User", foreign_keys=[created_by], backref="created_quotes")
    approver = relationship("User", foreign_keys=[approved_by], backref="approved_quotes")
    items = relationship("QuoteItem", backref="quote", cascade="all, delete-orphan")
    status_history = relationship("QuoteStatusHistory", backref="quote", cascade="all, delete-orphan")


class QuoteStatusHistory(Base):
    __tablename__ = "quote_status_history"

    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(Integer, ForeignKey("quotes_v2.id"), nullable=False)

    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)

    changer = relationship("User", backref="quote_status_changes")


class QuoteItem(Base):
    __tablename__ = "quote_items"

    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(Integer, ForeignKey("quotes_v2.id"), nullable=False)

    # ── Phase 7A: authoritative DXF source ───────────────────────────────────
    rfq_file_id = Column(Integer, ForeignKey("rfq_files.id"), nullable=True)
    geometry_svg = Column(Text, nullable=True)   # inline SVG — used when rfq_file_id is None

    # Part details
    part_name = Column(String, nullable=False)
    material = Column(String, nullable=False)
    thickness = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    weight = Column(Float, nullable=False, default=0.0)

    # Costs
    material_cost = Column(Float, nullable=False, default=0.0)
    cutting_cost = Column(Float, nullable=False, default=0.0)
    bending_cost = Column(Float, nullable=False, default=0.0)
    welding_cost = Column(Float, nullable=False, default=0.0)
    machining_cost = Column(Float, nullable=False, default=0.0)
    labour_cost = Column(Float, nullable=False, default=0.0)
    part_total = Column(Float, nullable=False, default=0.0)

    # Snapshots
    material_rate_snapshot = Column(Float, nullable=False, default=0.0)
    laser_rate_snapshot = Column(Float, nullable=False, default=0.0)
    bending_rate_snapshot = Column(Float, nullable=False, default=0.0)
    welding_rate_snapshot = Column(Float, nullable=False, default=0.0)
    machining_rate_snapshot = Column(Float, nullable=False, default=0.0)
    labour_rate_snapshot = Column(Float, nullable=False, default=0.0)
    margin_snapshot = Column(Float, nullable=False, default=0.0)
    gst_snapshot = Column(Float, nullable=False, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    rfq_file = relationship("RFQFile", backref="quote_items")


class QuoteItemSvgCache(Base):
    """
    Caches generated SVG geometry for each RFQ file.
    Keyed by rfq_file_id — immutable once generated.
    Re-used for every PDF regeneration of any quote that contains this file.
    """
    __tablename__ = "quote_item_svg_cache"

    id           = Column(Integer, primary_key=True, index=True)
    rfq_file_id  = Column(Integer, ForeignKey("rfq_files.id"), unique=True, nullable=False, index=True)
    svg_content  = Column(Text, nullable=False)      # full inline SVG string
    generated_at = Column(DateTime, default=datetime.utcnow)

    rfq_file = relationship("RFQFile")
