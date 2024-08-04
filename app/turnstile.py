from datetime import datetime
from typing import List

import aiohttp
from pydantic import BaseModel, Field

from .env import Env


class TurnstileResponse(BaseModel):
    success: bool
    challenge_ts: datetime
    hostname: str
    error_codes: List[str] = Field(..., alias="error-codes")
    action: str
    cdata: str

    class Config:
        populate_by_name = True


class Turnstile:
    @classmethod
    async def verify(cls, token: str) -> TurnstileResponse:
        data = {"secret": Env.get("turnstile_secret"), "response": token}

        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify", data=data
            ) as response:
                return TurnstileResponse.model_validate(await response.json())
