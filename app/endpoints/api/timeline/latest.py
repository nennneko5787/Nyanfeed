from fastapi import APIRouter

from ....services import BoardService

router = APIRouter()


@router.get("/api/timeline/latest")
async def latestTimeLine(page: int = 0):
    return await BoardService.getLocalTimeLine(page)
