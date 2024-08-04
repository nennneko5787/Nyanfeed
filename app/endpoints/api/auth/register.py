import re

import asyncpg
import bcrypt
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from snowflake import SnowflakeGenerator

from .... import Env, Turnstile, TurnstileResponse

router = APIRouter()


class RegisterModel(BaseModel):
    username: str
    password: str
    turnstile: str


def isValidUserName(s: str) -> bool:
    # 正規表現パターンを定義
    pattern = re.compile(r"^[a-zA-Z0-9_.]+$")
    # パターンにマッチするかどうかをチェック
    return bool(pattern.match(s))


@router.post("/api/auth/register", include_in_schema=False)
async def register(model: RegisterModel):
    if not isValidUserName(model.username) or len(model.username) > 14:
        raise HTTPException(400, "INVALID_USERNAME")

    salt = bcrypt.gensalt(rounds=10, prefix=b"2a")
    model.password = bcrypt.hashpw(model.password.encode(), salt).decode()
    tsResponse: TurnstileResponse = await Turnstile.verify(model.turnstile)
    if not tsResponse.success:
        raise HTTPException(400, "FAILED_TO_VERIFY_CAPTHCA")

    conn: asyncpg.Connection = await asyncpg.connect(Env.get("dsn"))
    try:
        user: asyncpg.Record = await conn.fetchrow(
            "SELECT * FROM users WHERE username_lower = $1", model.username.lower()
        )
    except:
        await conn.close()
        raise HTTPException(500, "DATABASE_ERROR")

    if user:
        await conn.close()
        raise HTTPException(400, "USERNAME_ALREADY_EXISTS")

    gen = SnowflakeGenerator(42)

    userId = next(gen)

    try:
        await conn.execute(
            """
                INSERT INTO users
                (id, username, username_lower, password)
                VALUES ($1, $2, $3, $4)
            """,
            userId,
            model.username,
            model.username.lower(),
            model.password,
        )
    except:
        await conn.close()
        raise HTTPException(500, "DATABASE_ERROR")

    token = Env.token(30)

    try:
        await conn.execute(
            """
                INSERT INTO tokens
                (token, user_id)
                VALUES ($1, $2)
            """,
            token,
            userId,
        )
    except:
        await conn.close()
        raise HTTPException(500, "DATABASE_ERROR")

    await conn.close()

    return {
        "detail": "registed",
        "token": token,
        "user_id": userId,
        "user_id_str": str(userId),
    }
