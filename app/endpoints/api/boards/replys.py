from fastapi import APIRouter, Depends

from ....objects import User
from ....services import BoardService, UserAuthService

router = APIRouter()


@router.get("/api/boards/{boardId:int}/replys")
async def latestTimeLine(
    boardId: int,
    page: int = 0,
    user: User = Depends(UserAuthService.getUserFromBearerToken),
):
    return await BoardService.getReplys(boardId, page=page, user=user)
