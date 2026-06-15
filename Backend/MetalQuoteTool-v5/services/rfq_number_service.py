from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from models.rfq import RFQ

def generate_rfq_number(db: Session) -> str:
    current_year = datetime.now().year
    prefix = f"RFQ-{current_year}-"

    # Find the latest RFQ number for the current year
    latest_rfq = db.query(RFQ).filter(RFQ.rfq_number.like(f"{prefix}%")).order_by(RFQ.rfq_number.desc()).first()

    if latest_rfq:
        # Extract the sequence number
        last_sequence_str = latest_rfq.rfq_number.split("-")[-1]
        try:
            next_sequence = int(last_sequence_str) + 1
        except ValueError:
            next_sequence = 1
    else:
        # First RFQ of the year
        next_sequence = 1

    return f"{prefix}{next_sequence:04d}"
