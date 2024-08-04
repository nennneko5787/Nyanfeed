from fastapi import APIRouter, Depends

from ....objects import User
from ....services import UserAuthService

router = APIRouter()


@router.get("/api/users/me")
async def me(
    user: User = Depends(UserAuthService.getUserFromBearerToken),
):
    return user
