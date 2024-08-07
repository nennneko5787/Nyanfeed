from fastapi import APIRouter, Depends

from ....objects import Board, User
from ....services import BoardService, UserAuthService

router = APIRouter()


@router.get("/api/boards/{board_id:int}")
async def getBoard(
    board_id: int, user: User = Depends(UserAuthService.getUserFromBearerToken)
):
    board: Board = await BoardService.getBoard(board_id, user=user)
    return board
