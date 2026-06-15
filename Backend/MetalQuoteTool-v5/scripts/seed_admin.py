import os
from sqlalchemy.orm import Session
from core.database import SessionLocal, engine, Base
from models.user import User
from core.security import get_password_hash
from dotenv import load_dotenv

def seed_admin():
    load_dotenv()
    
    # Schema managed by Alembic
    print("Connecting to PostgreSQL...")
    
    db: Session = SessionLocal()
    
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    
    if not admin_email or not admin_password:
        print("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env")
        return
        
    existing_user = db.query(User).filter(User.email == admin_email).first()
    if existing_user:
        print(f"Admin user {admin_email} already exists.")
    else:
        new_admin = User(
            email=admin_email,
            password_hash=get_password_hash(admin_password),
            role="Admin"
        )
        db.add(new_admin)
        db.commit()
        print(f"Successfully created admin user: {admin_email}")
        
    db.close()

if __name__ == "__main__":
    seed_admin()
