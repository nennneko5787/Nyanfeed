import os
import random
import string

import asyncpg

if os.path.isfile(".env"):
    from dotenv import load_dotenv

    load_dotenv()


class Env:
    pool: asyncpg.Pool = None

    @classmethod
    def get(cls, key: str):
        return os.getenv(key)

    @classmethod
    def token(cls, n: int):
        return "".join(random.choices(string.ascii_letters + string.digits, k=n))
