import asyncio
import html
import traceback
import mimetypes
from typing import Optional, List

import asyncpg
import aioboto3
from snowflake import SnowflakeGenerator
from fastapi import UploadFile

from .. import Env
from ..objects import Board, BoardNotFoundError, User, UnauthorizedFileExtensionError


class BoardService:
    allowFileExtensions = [
        "image/png",
        "image/apng",
        "image/gif",
        "image/jpeg",
        "image/webp",
        "video/mp4",
        "video/webm",
        "video/ogg",
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "audio/webm",
    ]

    @classmethod
    async def getLocalTimeLine(cls, page: int = 0):
        conn: asyncpg.Connection = await asyncpg.connect(Env.get("dsn"))
        try:
            _boards = await conn.fetch(
                "SELECT * FROM boards ORDER BY created_at DESC LIMIT 20 OFFSET $1",
                page * 20,
            )
        except Exception as e:
            await conn.close()
            raise e
        boards = []
        await conn.close()
        tasks = [cls.dictToBoard(dict(board)) for board in _boards]
        boards = await asyncio.gather(*tasks)
        return boards

    @staticmethod
    async def fetch_user(user_id):
        conn = await asyncpg.connect(Env.get("dsn"))
        try:
            user_row = await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)
        finally:
            await conn.close()
        return User.model_validate(dict(user_row))

    @staticmethod
    async def fetch_replys_count(board_id):
        conn = await asyncpg.connect(Env.get("dsn"))
        try:
            replys_count = await conn.fetchval(
                "SELECT COUNT(*) FROM boards WHERE reply_id = $1", board_id
            )
        finally:
            await conn.close()
        return replys_count

    @staticmethod
    async def fetch_reboards_count(board_id):
        conn = await asyncpg.connect(Env.get("dsn"))
        try:
            reboards_count = await conn.fetchval(
                "SELECT COUNT(*) FROM boards WHERE reboard_id = $1", board_id
            )
        finally:
            await conn.close()
        return reboards_count

    @classmethod
    async def fetch_reply(cls, reply_id: int):
        if reply_id is None:
            return None
        conn = await asyncpg.connect(Env.get("dsn"))
        try:
            reply_row = await conn.fetchrow(
                "SELECT * FROM boards WHERE id = $1", reply_id
            )
        finally:
            await conn.close()
        return await cls.dictToBoard(dict(reply_row))

    @classmethod
    async def fetch_reboard(cls, reboard_id: int):
        if reboard_id is None:
            return None
        conn = await asyncpg.connect(Env.get("dsn"))
        try:
            reboard_row = await conn.fetchrow(
                "SELECT * FROM boards WHERE id = $1", reboard_id
            )
        finally:
            await conn.close()
        return await cls.dictToBoard(dict(reboard_row))

    @classmethod
    async def dictToBoard(cls, board):
        try:
            user_task = cls.fetch_user(board["user_id"])
            replys_count_task = cls.fetch_replys_count(board["id"])
            reboards_count_task = cls.fetch_reboards_count(board["id"])
            reply_task = cls.fetch_reply(board.get("reply_id"))
            reboard_task = cls.fetch_reboard(board.get("reboard_id"))

            user, replys_count, reboards_count, reply, reboard = await asyncio.gather(
                user_task,
                replys_count_task,
                reboards_count_task,
                reply_task,
                reboard_task,
            )

            board["user"] = user
            board["replys_count"] = replys_count
            board["reboards_count"] = reboards_count
            board["reply"] = reply
            board["reboard"] = reboard

        except Exception as e:
            raise e

        return Board.model_validate(board)

    @classmethod
    async def create(
        cls,
        *,
        user: User,
        content: str,
        reply_id: Optional[int] = None,
        reboard_id: Optional[int] = None,
        files: Optional[List[UploadFile]] = None,
    ):
        conn: asyncpg.Connection = await asyncpg.connect(Env.get("dsn"))
        content = html.escape(content)

        if reply_id:
            try:
                row = await conn.execute("SELECT * FROM boards WHERE id = $1", reply_id)
            except Exception as e:
                await conn.close()
                raise e
            if not row:
                raise BoardNotFoundError()

        if reboard_id:
            try:
                row = await conn.execute(
                    "SELECT * FROM boards WHERE id = $1", reboard_id
                )
            except Exception as e:
                await conn.close()
                raise e
            if not row:
                raise BoardNotFoundError()

        gen = SnowflakeGenerator(42)
        boardId = next(gen)

        filesKey = []

        if len(files) > 0:
            session = aioboto3.Session()
            async with session.client(
                service_name="s3",
                endpoint_url=Env.get("r2_endpoint"),
                aws_access_key_id=Env.get("r2_ackeyid"),
                aws_secret_access_key=Env.get("r2_scackey"),
                region_name="apac",
            ) as client:
                for file in files:
                    if not file:
                        continue
                    if not file.content_type in cls.allowFileExtensions:
                        raise UnauthorizedFileExtensionError()
                    fileId = f"boards/{boardId}/{next(gen)}{mimetypes.guess_extension(file.content_type)}"
                    filesKey.append(fileId)
                    await client.upload_fileobj(file, "nyanfeed", fileId)
                    await asyncio.sleep(0)

        try:
            board = await conn.fetchrow(
                "INSERT INTO boards (id, user_id, reply_id, reboard_id, content, attachments, liked_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
                boardId,
                user.id,
                reply_id,
                reboard_id,
                content,
                filesKey,
                [],
            )
        except Exception as e:
            await conn.close()
            raise e

        board = await cls.dictToBoard(dict(board))
        return board
