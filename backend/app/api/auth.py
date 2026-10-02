from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.core.security import get_current_user, AuthenticatedUser

router = APIRouter(prefix="/auth", tags=["Authentication"])


class ProfileResponse(BaseModel):
    id: str
    email: Optional[str] = None
    role: str
    full_name: Optional[str] = None


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(current_user: AuthenticatedUser = Depends(get_current_user)):
    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        full_name=current_user.full_name
    )


@router.post("/profile", response_model=ProfileResponse)
async def sync_profile(current_user: AuthenticatedUser = Depends(get_current_user)):
    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        full_name=current_user.full_name
    )
