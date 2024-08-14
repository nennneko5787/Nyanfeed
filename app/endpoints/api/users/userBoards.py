from fastapi import APIRouter, Depends

from ....objects import User
from ....services import UserAuthService, UserService

router = APIRouter()


@router.get("/api/users/@{username:str}/boards")
async def userBoards(
    username: str,
    page: int = 0,
    user: User = Depends(UserAuthService.getUserFromBearerToken),
):
    return await UserService.getUserBoards(username, page, user=user)
