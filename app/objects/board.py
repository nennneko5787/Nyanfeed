from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, field_serializer

from .user import User


class Board(BaseModel):
    id: int
    created_at: datetime
    edited_at: Optional[datetime] = None
    user: User
    user_id: int
    reply_id: Optional[int] = None
    reply: Optional["Board"] = None
    reboard_id: Optional[int] = None
    reboard: Optional["Board"] = None
    content: str
    raw_content: Optional[str] = None
    attachments: List[str]
    liked_id: List[int]

    @field_serializer("created_at")
    def convertCreatedAt(self, dt: datetime) -> str:
        return dt.isoformat()

    @field_serializer("edited_at")
    def convertEditedAt(self, dt: Optional[datetime] = None) -> Optional[str]:
        return dt.isoformat() if dt is not None else None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.raw_content = self.content
        self.content = (
            self.content.replace("\r\n", "<br>")
            .replace("\r", "<br>")
            .replace("\n", "<br>")
        )
