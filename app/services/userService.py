import asyncio
import mimetypes
import html
from typing import List, Optional

import aioboto3
from fastapi import UploadFile

from .. import Env
from ..objects import (
    FileSizeTooLargeError,
    UnauthorizedFileExtensionError,
    User,
    UserFreezedError,
    tooLongError,
)


class UserService:
    allowFileExtensions = [
        "image/png",
        "image/apng",
        "image/gif",
        "image/jpeg",
        "image/webp",
    ]

    @classmethod
    async def getUser(cls, userId: int):
        _user = await Env.pool.fetchrow("SELECT * FROM users WHERE id = $1", userId)
        user = User.model_validate(dict(_user))
        return user

    @classmethod
    async def getUserByScreenName(cls, screenName: str):
        _user = await Env.pool.fetchrow(
            "SELECT * FROM users WHERE username_lower = $1", screenName.lower()
        )
        user = User.model_validate(dict(_user))
        return user

    @classmethod
    async def getUserBoards(cls, username: str, page: int = 0, *, user: User = None):
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
                WHERE boards.user_id = $1 AND boards.reply_id IS NULL
                ORDER BY boards.created_at DESC
                LIMIT 20 OFFSET $2;
            """,
            (await cls.getUserByScreenName(username)).id,
            page * 20,
        )
        boards = []
        from .boardService import BoardService

        tasks = [BoardService.dictToBoard(dict(board), user=user) for board in _boards]
        boards = await asyncio.gather(*tasks)
        return boards

    @classmethod
    async def edit(
        cls,
        user: User,
        *,
        displayName: Optional[str] = None,
        description: Optional[str] = None,
        icon: Optional[UploadFile] = None,
        header: Optional[UploadFile] = None,
    ):
        from .boardService import BoardService

        if len(displayName) > 50:
            raise tooLongError()

        iconFileId = None
        headerFileId = None

        session = aioboto3.Session()
        async with session.client(
            service_name="s3",
            endpoint_url=Env.get("r2_endpoint"),
            aws_access_key_id=Env.get("r2_ackeyid"),
            aws_secret_access_key=Env.get("r2_scackey"),
            region_name="apac",
        ) as client:
            if icon.size > 0:
                if not icon.content_type in cls.allowFileExtensions:
                    raise UnauthorizedFileExtensionError()
                if icon.size >= 5242880:
                    raise FileSizeTooLargeError()
                iconFileId = (
                    f"users/{user.id}{mimetypes.guess_extension(icon.content_type)}"
                )
                await client.upload_fileobj(icon, "nyanfeed", iconFileId)
                iconFileId = f"https://r2.htnmk.com/{iconFileId}"
            if header.size > 0:
                if not header.content_type in cls.allowFileExtensions:
                    raise UnauthorizedFileExtensionError()
                if header.size >= 5242880:
                    raise FileSizeTooLargeError()
                headerFileId = (
                    f"users/{user.id}{mimetypes.guess_extension(header.content_type)}"
                )
                await client.upload_fileobj(header, "nyanfeed", headerFileId)
                headerFileId = f"https://r2.htnmk.com/{headerFileId}"
        _user = await Env.pool.fetchrow(
            """
                UPDATE only users
                SET display_name = $1,
                    description = $2,
                    icon = $3,
                    header = $4
                WHERE id = $5
                RETURNING *
            """,
            (
                html.escape(displayName)
                if displayName is not None
                else html.escape(user.display_name)
            ),
            (
                html.escape(description)
                if description is not None
                else html.escape(user.description)
            ),
            iconFileId if icon.size > 0 else user.icon,
            headerFileId if header.size > 0 else user.header,
            user.id,
        )
        user = User.model_validate(dict(_user))
        return user

    @classmethod
    async def toggleFollowUser(cls, toUser: User, user: User):
        if user.freezed:
            raise UserFreezedError()

        ifollowered = False

        followers: List[int] = await Env.pool.fetchval(
            "SELECT followers FROM users WHERE id = $1", toUser.id
        )

        following: List[int] = await Env.pool.fetchval(
            "SELECT following FROM users WHERE id = $1", user.id
        )

        if not followers:
            followers = []

        if not following:
            following = []

        if user.id in followers:
            followers.remove(user.id)
        else:
            followers.append(user.id)
            ifollowered = True

        if toUser.id in following:
            following.remove(toUser.id)
        else:
            following.append(toUser.id)

        followersCount = len(followers)

        await Env.pool.execute(
            "UPDATE users SET followers = $1 WHERE id = $2", followers, toUser.id
        )

        await Env.pool.execute(
            "UPDATE users SET following = $1 WHERE id = $2", following, user.id
        )

        return ifollowered, followersCount
