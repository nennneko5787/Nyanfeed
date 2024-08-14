from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from ....objects import Board, User
from ....services import BoardService, UserAuthService
from ...websocket import ConnectionManager

router = APIRouter()


@router.post("/api/boards/{boardId:int}/like")
async def getBoard(
    backgroundTasks: BackgroundTasks,
    boardId: int,
    user: User = Depends(UserAuthService.getUserFromBearerToken),
):
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Bearer authentication required",
            headers={"WWW-Authenticate": 'Bearer realm="auth_required"'},
        )
    iliked, count = await BoardService.toggleLikeBoard(boardId, user)
    backgroundTasks.add_task(
        ConnectionManager.sendLike,
        boardId=boardId,
        iliked=iliked,
        count=count,
        user=user,
    )
    return {"iliked": iliked, "count": count}
