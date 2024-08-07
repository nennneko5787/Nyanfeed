import asyncpg
import bcrypt
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .... import Env


class LoginModel(BaseModel):
    username: str
    password: str


router = APIRouter()


@router.post("/api/auth/login", include_in_schema=True)
async def login(model: LoginModel):
    try:
        user = Env.pool.fetchrow(
            "SELECT * FROM users WHERE username_lower = $1", model.username.lower()
        )
    except:
        Env.pool.close()
        raise HTTPException(500, "DATABASE_ERROR")

    if not bcrypt.checkpw(model.password.encode(), user["password"].encode()):
        Env.pool.close()
        raise HTTPException(500, "INVALID_USERNAME_OR_PASSWORD")

    token = Env.token(30)

    try:
        Env.pool.execute(
            """
                INSERT INTO tokens
                (token, user_id)
                VALUES ($1, $2)
            """,
            token,
            user["id"],
        )
    except:
        Env.pool.close()
        raise HTTPException(500, "DATABASE_ERROR")

    Env.pool.close()
    return {
        "token": token,
        "user_id": user["id"],
        "user_id_str": str(user["id"]),
    }
