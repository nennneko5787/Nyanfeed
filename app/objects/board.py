import re
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, field_serializer

from .user import User


class Board(BaseModel):
    id: int
    id_str: str = ""
    created_at: datetime
    edited_at: Optional[datetime] = None
    user: User
    user_id: int
    user_id_str: str = ""
    reply_id: Optional[int] = None
    reply_id_str: Optional[str] = None
    reply: Optional["Board"] = None
    reboard_id: Optional[int] = None
    reboard_id_str: Optional[str] = None
    reboard: Optional["Board"] = None
    content: str
    raw_content: Optional[str] = None
    attachments: List[str]
    liked_id: List[int]
    liked_id_str: List[str] = []
    iliked: Optional[bool] = False
    replys_count: Optional[int] = 0
    reboards_count: Optional[int] = 0

    @field_serializer("created_at")
    def convertCreatedAt(self, dt: datetime) -> str:
        return dt.isoformat()

    @field_serializer("edited_at")
    def convertEditedAt(self, dt: Optional[datetime]) -> Optional[str]:
        return dt.isoformat() if dt is not None else None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.id_str = str(self.id)
        self.user_id_str = str(self.user_id)
        if self.reply_id:
            self.reply_id_str = str(self.reply_id)
        if self.reboard_id:
            self.reboard_id_str = str(self.reboard_id)
        for uid in self.liked_id:
            self.liked_id_str.append(str(uid))
        self.raw_content = self.content
        url_pattern = re.compile(
            r"(http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+)"
        )
        self.content = url_pattern.sub(r'<a href="\1">\1</a>', self.content)
        self.content = (
            self.content.replace("\r\n", "<br>")
            .replace("\r", "<br>")
            .replace("\n", "<br>")
        )
