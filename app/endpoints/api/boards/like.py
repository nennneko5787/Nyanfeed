from fastapi import APIRouter, Depends

from ...websocket import ConnectionManager
from ....objects import Board, User
from ....services import BoardService, UserAuthService

router = APIRouter()


@router.post("/api/boards/{board_id:int}/like")
async def getBoard(
    board_id: int, user: User = Depends(UserAuthService.getUserFromBearerToken)
):
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Bearer authentication required",
            headers={"WWW-Authenticate": 'Bearer realm="auth_required"'},
        )
    iliked, count = await BoardService.toggleLikeBoard(board_id, user)
    await ConnectionManager.broadcast(
        {
            "type": "liked",
            "data": {
                "board_id": board_id,
                "board_id_str": str(board_id),
                "iliked": iliked,
                "count": count,
            },
        }
    )
    return {"iliked": iliked, "count": count}
