from typing import Optional
from fastapi import HTTPException
from models.quote import Quote, QuoteStatusHistory
from sqlalchemy.orm import Session
from datetime import datetime
from models.user import User

class QuoteStatusMachine:
    # Valid Statuses
    DRAFT = "Draft"
    READY_FOR_REVIEW = "Ready For Review"
    APPROVED = "Approved"
    SENT = "Sent"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"

    VALID_TRANSITIONS = {
        DRAFT: [READY_FOR_REVIEW],
        READY_FOR_REVIEW: [APPROVED],
        APPROVED: [SENT],
        SENT: [ACCEPTED, REJECTED],
        ACCEPTED: [], # Terminal
        REJECTED: [DRAFT] # Quote recovery
    }

    @classmethod
    def validate_transition(cls, old_status: str, new_status: str) -> bool:
        allowed = cls.VALID_TRANSITIONS.get(old_status, [])
        return new_status in allowed

    @classmethod
    def transition_status(
        cls, 
        db: Session, 
        quote: Quote, 
        new_status: str, 
        user: User, 
        notes: Optional[str] = None
    ) -> Quote:
        old_status = quote.status

        # If it's already in the target status, do nothing
        if old_status == new_status:
            return quote
            
        if not cls.validate_transition(old_status, new_status):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid quote status transition from '{old_status}' to '{new_status}'."
            )

        # Update the quote status
        quote.status = new_status
        quote.updated_at = datetime.utcnow()

        # Approval tracking logic
        if new_status == cls.APPROVED:
            # Here we could check user.role == 'Admin' if needed
            quote.approved_by = user.id
            quote.approved_at = datetime.utcnow()

        # Create audit trail
        history = QuoteStatusHistory(
            quote_id=quote.id,
            old_status=old_status,
            new_status=new_status,
            changed_by=user.id,
            notes=notes
        )
        db.add(history)
        
        db.commit()
        db.refresh(quote)
        return quote
