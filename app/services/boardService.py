import asyncio
import html
import mimetypes
import traceback
from typing import List, Optional

import aioboto3
import asyncpg
from fastapi import UploadFile
from snowflake import SnowflakeGenerator

from .. import Env
from ..objects import (
    Board,
    BoardNotFoundError,
    UnauthorizedFileExtensionError,
    FileSizeTooLargeError,
    User,
)
from .userService import UserService


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
    async def getLocalTimeLine(cls, page: int = 0, *, user: Optional[User] = None):
        _boards = await Env.pool.fetch(
            """
                SELECT boards.id, boards.content, boards.reply_id, boards.reboard_id, boards.user_id, boards.created_at, boards.edited_at, boards.attachments, boards.liked_id,
                    (SELECT COUNT(*) FROM boards AS b WHERE b.reply_id = boards.id) AS replys_count,
                    (SELECT COUNT(*) FROM boards AS b WHERE b.reboard_id = boards.id) AS reboards_count,
                    r.id AS reply_id,
                    rb.id AS reboard_id
                FROM boards
                LEFT JOIN boards AS r ON boards.reply_id = r.id
                LEFT JOIN boards AS rb ON boards.reboard_id = rb.id
                ORDER BY boards.created_at DESC
                LIMIT 20 OFFSET $1;
            """,
            page * 20,
        )
        boards = []
        tasks = [cls.dictToBoard(dict(board), user=user) for board in _boards]
        boards = await asyncio.gather(*tasks)
        return boards

    @classmethod
    async def getBoard(cls, board_id: int, *, user: Optional[User] = None):
        _board = await Env.pool.fetchrow(
            """
                SELECT boards.id, boards.content, boards.reply_id, boards.reboard_id, boards.user_id, boards.created_at, boards.edited_at, boards.attachments, boards.liked_id,
                    (SELECT COUNT(*) FROM boards AS b WHERE b.reply_id = boards.id) AS replys_count,
                    (SELECT COUNT(*) FROM boards AS b WHERE b.reboard_id = boards.id) AS reboards_count,
                    r.id AS reply_id,
                    rb.id AS reboard_id
                FROM boards
                LEFT JOIN boards AS r ON boards.reply_id = r.id
                LEFT JOIN boards AS rb ON boards.reboard_id = rb.id
                WHERE boards.id = $1;
            """,
            board_id,
        )
        board = await cls.dictToBoard(dict(_board), user=user)
        return board

    @classmethod
    async def dictToBoard(cls, board, *, user: Optional[User] = None):
        board["user"] = await UserService.getUser(board["user_id"])
        board["reply"] = (
            await UserService.getUser(board["reply_id"])
            if board["reply_id"] is not None
            else None
        )
        board["reboard"] = (
            await UserService.getUser(board["reboard_id"])
            if board["reboard_id"] is not None
            else None
        )
        board = Board.model_validate(board)
        if user:
            if user.id in board.liked_id:
                board.iliked = True
            else:
                board.iliked = False
        return board

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
        content = html.escape(content)

        if reply_id:
            row = await Env.pool.execute("SELECT * FROM boards WHERE id = $1", reply_id)
            if not row:
                raise BoardNotFoundError()

        if reboard_id:
            row = await Env.pool.execute(
                "SELECT * FROM boards WHERE id = $1", reboard_id
            )
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
                    if file.size >= 5242880:
                        raise FileSizeTooLargeError()
                    fileId = f"boards/{boardId}/{next(gen)}{mimetypes.guess_extension(file.content_type)}"
                    filesKey.append(fileId)
                    await client.upload_fileobj(file, "nyanfeed", fileId)
                    await asyncio.sleep(0)

        board = await Env.pool.fetchrow(
            "INSERT INTO boards (id, user_id, reply_id, reboard_id, content, attachments, liked_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            boardId,
            user.id,
            reply_id,
            reboard_id,
            content,
            filesKey,
            [],
        )

        board = await cls.dictToBoard(dict(board))
        return board

    @classmethod
    async def toggleLikeBoard(cls, board_id: int, user: User):
        iliked = False

        liked_id: List[int] = await Env.pool.fetchval(
            "SELECT liked_id FROM boards WHERE id = $1", board_id
        )

        if not liked_id:
            liked_id = []

        if user.id in liked_id:
            liked_id.remove(user.id)
        else:
            liked_id.append(user.id)
            iliked = True

        count = len(liked_id)

        await Env.pool.execute(
            "UPDATE boards SET liked_id = $1 WHERE id = $2", liked_id, board_id
        )

        return iliked, count
