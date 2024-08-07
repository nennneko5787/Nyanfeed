from fastapi import APIRouter, Depends

from ...websocket import ConnectionManager
from ....objects import Board, User
from ....services import BoardService, UserAuthService

router = APIRouter()


@router.post("/api/boards/{boardId:int}/like")
async def getBoard(
    boardId: int, user: User = Depends(UserAuthService.getUserFromBearerToken)
):
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Bearer authentication required",
            headers={"WWW-Authenticate": 'Bearer realm="auth_required"'},
        )
    iliked, count = await BoardService.toggleLikeBoard(boardId, user)
    await ConnectionManager.sendLike(
        boardId=boardId, iliked=iliked, count=count, user=user
    )
    return {"iliked": iliked, "count": count}
