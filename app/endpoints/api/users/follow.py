from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from ....objects import Board, User
from ....services import UserAuthService, UserService
from ...websocket import ConnectionManager

router = APIRouter()


@router.post("/api/users/@{username:str}/follow")
async def getBoard(
    backgroundTasks: BackgroundTasks,
    username: str,
    user: User = Depends(UserAuthService.getUserFromBearerToken),
):
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Bearer authentication required",
            headers={"WWW-Authenticate": 'Bearer realm="auth_required"'},
        )
    toUser = await UserService.getUserByScreenName(username)
    ifollowered, count = await UserService.toggleFollowUser(toUser, user)
    return {"ifollowered": ifollowered, "count": count}
