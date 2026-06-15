from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user
from models.user import User
from schemas.user_schema import LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    
    # Set HttpOnly cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True, # Ensure HTTPS in production
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(response: Response):
    # Clear the cookie
    response.delete_cookie("access_token", secure=True, httponly=True, samesite="lax")
    return {"message": "Successfully logged out"}
