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
        print(_boards)
        for board in _boards:
            board = await cls.dictToBoard(dict(board))
            boards.append(board)
        await conn.close()
        return boards

    @classmethod
    async def dictToBoard(cls, board: dict):
        conn: asyncpg.Connection = await asyncpg.connect(Env.get("dsn"))
        try:
            board["user"] = User.model_validate(
                dict(
                    await conn.fetchrow(
                        "SELECT * FROM users WHERE id = $1",
                        board["user_id"],
                    )
                )
            )
        except Exception as e:
            await conn.close()
            raise e
        try:
            board["replys_count"] = await conn.fetchval(
                "SELECT COUNT(*) FROM boards WHERE reply_id = $1",
                board["id"],
            )
        except Exception as e:
            await conn.close()
            raise e
        try:
            board["reboards_count"] = await conn.fetchval(
                "SELECT COUNT(*) FROM boards WHERE reboard_id = $1",
                board["id"],
            )
        except Exception as e:
            await conn.close()
            raise e
        if board["reply_id"] is not None:
            try:
                board["reply"] = await cls.dictToBoard(
                    dict(
                        await conn.fetchrow(
                            "SELECT * FROM boards WHERE id = $1",
                            board["reply_id"],
                        )
                    )
                )
            except Exception as e:
                await conn.close()
                raise e
        if board["reboard_id"] is not None:
            try:
                board["reboard"] = await cls.dictToBoard(
                    dict(
                        await conn.fetchrow(
                            "SELECT * FROM boards WHERE id = $1",
                            board["reboard_id"],
                        )
                    )
                )
            except Exception as e:
                await conn.close()
                raise e
        await conn.close()
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
                    if not file.content_type in cls.allowFileExtensions:
                        raise UnauthorizedFileExtensionError()
                    fileId = f"boards/{boardId}/{next(gen)}{mimetypes.guess_extension(file.content_type)}"
                    filesKey.append(fileId)
                    await client.upload_fileobj(file, "nyanfeed", fileId)

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
