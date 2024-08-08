from fastapi import Header, HTTPException

from .. import Env
from ..objects import User


class UserAuthService:
    @classmethod
    async def getUserFromBearerToken(
        cls,
        authorization: str = Header(None),
    ):
        if not authorization:
            return None

        bearer = authorization.split(" ")[1]

        user_id = await Env.pool.fetchval(
            f"SELECT user_id FROM tokens WHERE token = $1", bearer
        )

        if not user_id:
            return None

        user = await Env.pool.fetchrow(
            f"SELECT * FROM users WHERE id = $1",
            user_id,
        )

        if not user:
            return None

        user = dict(user)

        return User.model_validate(dict(user))

    @classmethod
    async def getUserFromStringToken(cls, token: str):
        user_id = await Env.pool.fetchval(
            f"SELECT user_id FROM tokens WHERE token = $1",
            token,
        )

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user = await Env.pool.fetchrow(
            f"SELECT * FROM users WHERE id = $1",
            user_id,
        )

        if not user:
            return None

        user = dict(user)

        return User.model_validate(dict(user))
