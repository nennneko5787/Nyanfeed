from fastapi import APIRouter, Depends

from ....objects import User
from ....services import BoardService, UserAuthService

router = APIRouter()


@router.get("/api/timeline/latest")
async def latestTimeLine(
    page: int = 0, user: User = Depends(UserAuthService.getUserFromBearerToken)
):
    return await BoardService.getLocalTimeLine(page, user=user)
