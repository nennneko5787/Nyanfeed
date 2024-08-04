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
            raise HTTPException(
                status_code=401,
                detail="Bearer authentication required",
                headers={"WWW-Authenticate": 'Bearer realm="auth_required"'},
            )

        conn: asyncpg.Connection = await asyncpg.connect(Env.get("dsn"))

        try:
            user_id = await conn.fetchval(
                f"SELECT user_id FROM tokens WHERE token = $1",
                bearer.credentials,
            )
        except Exception as e:
            await conn.close()
            raise e

        if not user_id:
            await conn.close()
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        try:
            user = await conn.fetchrow(
                f"SELECT * FROM users WHERE id = $1",
                user_id,
            )
        except Exception as e:
            await conn.close()
            raise e

        if not user:
            await conn.close()
            raise HTTPException(status_code=404, detail="User not found")
        await conn.close()
        user = dict(user)

        return User.model_validate(dict(user))
