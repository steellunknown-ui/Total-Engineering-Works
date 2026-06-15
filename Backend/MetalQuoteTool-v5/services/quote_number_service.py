from sqlalchemy.orm import Session
from datetime import datetime
from models.quote import Quote
from sqlalchemy import func

def generate_quote_number(db: Session) -> str:
    """
    Generates a sequential quote number in the format Q-YYYY-XXXX.
    E.g., Q-2026-0001
    """
    current_year = datetime.utcnow().year
    prefix = f"Q-{current_year}-"

    # Query the highest quote number for the current year
    max_quote = db.query(func.max(Quote.quote_number)).filter(
        Quote.quote_number.like(f"{prefix}%")
    ).scalar()

    if max_quote:
        # max_quote will be something like "Q-2026-0042"
        try:
            # Extract the last 4 digits and increment
            sequence_str = max_quote.split("-")[-1]
            next_sequence = int(sequence_str) + 1
        except ValueError:
            next_sequence = 1
    else:
        next_sequence = 1

    # Format the sequence with zero padding (4 digits)
    return f"{prefix}{next_sequence:04d}"
