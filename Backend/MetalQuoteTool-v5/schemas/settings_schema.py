from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── Settings dict ─────────────────────────────────────────────────────────────

class SettingsResponse(BaseModel):
    """Flat key→value dict of all settings."""
    settings: dict


class SettingUpsertRequest(BaseModel):
    """
    Map of keys to update. Values can be numeric or string.
    Example: {"gst_percent": 18.0, "company_name": "Acme Ltd"}
    """
    updates: dict


# ── Audit ─────────────────────────────────────────────────────────────────────

class SettingAuditItem(BaseModel):
    id: int
    setting_key: str
    old_value: Optional[str]
    new_value: Optional[str]
    changed_by: Optional[int]
    changed_at: datetime

    class Config:
        from_attributes = True


class SettingAuditResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[SettingAuditItem]
