from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from datetime import datetime
from core.database import Base

class Setting(Base):
    """
    Settings-driven pricing + company configuration table.

    Numeric keys (use `value` column):
    - material_markup_percent
    - default_margin_percent
    - gst_percent
    - laser_cutting_rate
    - bending_rate
    - welding_rate
    - machining_rate
    - labour_rate
    - weight_rate_multiplier
    - quote_validity_days
    - std_rate_punching
    - std_rate_bending
    - std_rate_welding
    - std_rate_powder_dual

    String keys (use `str_value` column, value=0):
    - company_name
    - company_address
    - company_phone
    - company_email
    - company_website
    - company_gst
    - company_logo_url
    - terms_and_conditions
    """
    __tablename__ = "settings"

    id         = Column(Integer, primary_key=True, index=True)
    key        = Column(String, unique=True, index=True, nullable=False)
    value      = Column(Float, nullable=True)       # numeric settings
    str_value  = Column(Text, nullable=True)        # string settings
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SettingAudit(Base):
    """
    Immutable audit trail for every settings change.

    Records who changed what, when, and from/to which value.
    Used by Settings → Tab 6 (Audit History).
    """
    __tablename__ = "setting_audit"

    id          = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String, nullable=False, index=True)
    old_value   = Column(Text, nullable=True)    # previous value (serialised as string)
    new_value   = Column(Text, nullable=True)    # new value (serialised as string)
    changed_by  = Column(Integer, ForeignKey("users.id"), nullable=True)
    changed_at  = Column(DateTime, default=datetime.utcnow, nullable=False)
