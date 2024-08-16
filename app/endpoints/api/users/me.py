from fastapi import APIRouter, Depends, HTTPException

from ....objects import User
from ....services import UserAuthService

router = APIRouter()


@router.get("/api/users/me")
async def me(
    user: User = Depends(UserAuthService.getUserFromBearerToken),
):
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Bearer authentication required",
            headers={"WWW-Authenticate": 'Bearer realm="auth_required"'},
        )
    return user
