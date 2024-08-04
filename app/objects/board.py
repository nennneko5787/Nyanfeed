from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

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
    attachments: List[str]
    liked_id: List[int]
