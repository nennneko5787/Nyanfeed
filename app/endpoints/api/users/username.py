from fastapi import APIRouter, Depends

from ....objects import User
from ....services import UserService

router = APIRouter()


@router.get("/api/users/@{username:str}")
async def getUserByScreenName(username: str):
    return await UserService.getUserByScreenName(username)
