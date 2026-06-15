from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base


class Material(Base):
    """
    Master material catalogue.

    Replaces the hardcoded MATERIALS / DENSITY dicts in data/constants.py.
    Each row represents one material type (CRCA, HR Sheet, SS-304, etc.).
    active=False = soft-deleted (preserved for historical quotes).
    """
    __tablename__ = "materials"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, unique=True, nullable=False, index=True)
    density     = Column(Float, nullable=False, default=7850.0)   # kg/m³
    active      = Column(Boolean, nullable=False, default=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by  = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by  = Column(Integer, ForeignKey("users.id"), nullable=True)

    thicknesses  = relationship("MaterialThickness", back_populates="material",
                                cascade="all, delete-orphan")
    rate_bands   = relationship("MaterialRateBand", back_populates="material_rel",
                                primaryjoin="Material.name == foreign(MaterialRateBand.material_name)",
                                uselist=True, viewonly=True)


class MaterialThickness(Base):
    """
    Available thicknesses per material.

    Replaces THICKNESSES dict in data/constants.py.
    Controls what appears in Quote Tool / Instant Estimate dropdowns.
    active=False = soft-deleted.
    """
    __tablename__ = "material_thicknesses"
    __table_args__ = (
        UniqueConstraint("material_id", "thickness_mm", name="uq_material_thickness"),
    )

    id           = Column(Integer, primary_key=True, index=True)
    material_id  = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    thickness_mm = Column(Float, nullable=False)
    active       = Column(Boolean, nullable=False, default=True)
    created_at   = Column(DateTime, default=datetime.utcnow)

    material     = relationship("Material", back_populates="thicknesses")


class MaterialRateBand(Base):
    """
    Pricing bands: ₹/kg by material and thickness range.

    Replaces MATERIAL_RATE_BANDS dict in data/constants.py.
    material_name is a denormalised string so historical quotes never break
    even if a Material row is later renamed.
    active=False = soft-deleted.
    """
    __tablename__ = "material_rate_bands"

    id             = Column(Integer, primary_key=True, index=True)
    material_name  = Column(String, nullable=False, index=True)
    thickness_min  = Column(Float, nullable=False, default=0.0)   # inclusive lower bound
    thickness_max  = Column(Float, nullable=False)                # inclusive upper bound
    rate_low       = Column(Float, nullable=False)                 # ₹/kg landed low
    rate_high      = Column(Float, nullable=False)                 # ₹/kg landed high
    active         = Column(Boolean, nullable=False, default=True)
    created_at     = Column(DateTime, default=datetime.utcnow)
    updated_at     = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by     = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by     = Column(Integer, ForeignKey("users.id"), nullable=True)

    # viewonly back-ref from Material (by name, not FK)
    material_rel   = relationship("Material",
                                  primaryjoin="foreign(MaterialRateBand.material_name) == Material.name",
                                  uselist=False, viewonly=True)
