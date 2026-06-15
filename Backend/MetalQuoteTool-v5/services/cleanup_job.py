import asyncio
from datetime import datetime, timedelta
import logging
from core.database import SessionLocal
from models.rfq import RFQ, RFQFile
from services.storage_service import archive_rfq_file

logger = logging.getLogger(__name__)

async def storage_cleanup_loop():
    """
    Runs daily at 02:00 AM to archive old files according to retention policies.
    """
    while True:
        now = datetime.now()
        # Calculate time until next 02:00 AM
        next_run = now.replace(hour=2, minute=0, second=0, microsecond=0)
        if now >= next_run:
            next_run += timedelta(days=1)
            
        sleep_seconds = (next_run - now).total_seconds()
        print(f"[CleanupJob] Next storage cleanup scheduled in {sleep_seconds/3600:.2f} hours (at 02:00 AM)")
        
        # Sleep until 2 AM
        try:
            await asyncio.sleep(sleep_seconds)
        except asyncio.CancelledError:
            break
        
        # Run cleanup
        run_cleanup_job()

def run_cleanup_job():
    print("[CleanupJob] Running automated storage cleanup job...")
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        
        # Thresholds
        rejected_threshold = now - timedelta(days=30)
        estimate_threshold = now - timedelta(days=7)
        sent_threshold = now - timedelta(days=60)
        
        # Find active RFQ files
        active_files = db.query(RFQFile).join(RFQ).filter(RFQFile.storage_status == "active").all()
        
        archived_count = 0
        for f in active_files:
            rfq = f.rfq
            reason = None
            
            # Using created_at or estimate_date
            base_date = rfq.estimate_date or rfq.created_at
            
            if rfq.status == "Rejected" and base_date < rejected_threshold:
                reason = "Rejected"
            elif rfq.status == "Pending Review" and rfq.lead_source == "Instant Estimate" and base_date < estimate_threshold:
                reason = "Estimate Expired"
            elif rfq.status == "Quote Sent" and base_date < sent_threshold:
                reason = "Inactive Quote"
                
            if reason:
                try:
                    archive_rfq_file(f, db, reason)
                    archived_count += 1
                    print(f"[CleanupJob] Archived file {f.id} ({f.file_name}) for RFQ {rfq.rfq_number}. Reason: {reason}")
                except Exception as e:
                    print(f"[CleanupJob] Failed to archive file {f.id}: {e}")
                    db.rollback() 
                    
        print(f"[CleanupJob] Cleanup finished. Archived {archived_count} files.")
    finally:
        db.close()
