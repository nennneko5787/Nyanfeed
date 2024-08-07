from fastapi import APIRouter, Depends

from ....objects import Board, User
from ....services import BoardService, UserAuthService

router = APIRouter()


@router.get("/api/boards/{boardId:int}")
async def getBoard(
    boardId: int, user: User = Depends(UserAuthService.getUserFromBearerToken)
):
    board: Board = await BoardService.getBoard(boardId, user=user)
    return board
