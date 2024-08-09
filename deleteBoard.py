import asyncio
import os

import asyncpg

if os.path.isfile(".env"):
    from dotenv import load_dotenv

    load_dotenv(verbose=True)


async def main():
    conn: asyncpg.Connection = await asyncpg.connect(
        os.getenv("dsn"), statement_cache_size=0
    )
    await conn.execute(
        "DELETE FROM boards WHERE user_id = $1 OR user_id = $2;",
        7227627471938691073,
        7227597999776636929,
    )
    await conn.close()


asyncio.run(main())
