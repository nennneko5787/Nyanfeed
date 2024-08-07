import asyncpg

from .. import Env
from ..objects import User


class UserService:
    @classmethod
    async def getUser(cls, user_id: int):
        _user = await Env.pool.fetchrow("SELECT * FROM users WHERE id = $1", user_id)
        user = User.model_validate(dict(_user))
        return user
