import json

import asyncpg
from fastapi import Depends, Header, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .. import Env
from ..objects import User


class UserAuthService:
    @classmethod
    async def getUserFromBearerToken(
        cls,
        bearer: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False)),
    ):
        if bearer is None:
            return None

        user_id = await Env.pool.fetchval(
            f"SELECT user_id FROM tokens WHERE token = $1",
            bearer.credentials,
        )

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user = await Env.pool.fetchrow(
            f"SELECT * FROM users WHERE id = $1",
            user_id,
        )

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user = dict(user)

        return User.model_validate(dict(user))
