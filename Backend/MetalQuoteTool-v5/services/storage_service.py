import os
from supabase import create_client, Client
from fastapi import UploadFile, HTTPException
import uuid
import mimetypes

def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        raise HTTPException(status_code=500, detail="Supabase credentials not configured in .env")
    return create_client(url, key)

async def upload_rfq_file(file: UploadFile, rfq_number: str) -> str:
    """
    Uploads a file to Supabase Storage under the 'rfq-files' bucket.
    Path structure: active/{rfq_number}/{filename}
    Returns the storage path.
    """
    supabase = get_supabase_client()
    bucket_name = "rfq-files"

    # Read file content
    content = await file.read()
    
    # Generate unique filename to avoid overwrites if same name uploaded twice
    ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    
    file_path = f"active/{rfq_number}/{safe_filename}"
    
    content_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream"

    try:
        # Upload to Supabase
        res = supabase.storage.from_(bucket_name).upload(
            path=file_path,
            file=content,
            file_options={"content-type": content_type}
        )
        return file_path
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to Supabase: {str(e)}")

def archive_rfq_file(rfq_file, db, reason: str):
    """
    Moves a file from active to archive folder in Supabase storage and updates DB.
    """
    if rfq_file.storage_status != "active":
        return
        
    supabase = get_supabase_client()
    bucket_name = "rfq-files"
    
    old_path = rfq_file.storage_path
    new_path = "archive/" + old_path.replace("active/", "", 1)
    
    try:
        supabase.storage.from_(bucket_name).move(old_path, new_path)
    except Exception as e:
        # If it fails (e.g. not found), we still mark it archived if requested? 
        # Usually we want it to raise, but let's just log or raise.
        raise HTTPException(status_code=500, detail=f"Failed to move file in Supabase: {str(e)}")
        
    import datetime
    rfq_file.storage_path = new_path
    rfq_file.storage_status = "archived"
    rfq_file.archived_at = datetime.datetime.utcnow()
    rfq_file.archived_reason = reason
    db.commit()

def delete_rfq_file_permanently(rfq_file, db):
    """
    Permanently deletes a file from Supabase storage and updates DB.
    """
    if rfq_file.storage_status == "deleted":
        return
        
    supabase = get_supabase_client()
    bucket_name = "rfq-files"
    
    try:
        supabase.storage.from_(bucket_name).remove([rfq_file.storage_path])
    except Exception as e:
        pass # Ignore if file is already deleted physically
        
    rfq_file.storage_path = ""
    rfq_file.storage_status = "deleted"
    db.commit()

