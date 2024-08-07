from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, field_serializer


class User(BaseModel):
    id: int
    id_str: str = ""
    created_at: datetime
    username: str
    username_lower: str
    icon: str
    following: List[int]
    following_str: List[str] = []
    followers: List[int]
    followers_str: List[str] = []
    display_name: str
    description: Optional[str] = None
    raw_description: Optional[str] = None
    badge: Optional[str] = None

    @field_serializer("created_at")
    def convertCreatedAt(self, dt: datetime) -> str:
        return dt.isoformat()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.id_str = str(self.id)
        for uid in self.following:
            self.following_str.append(str(uid))
        for uid in self.followers:
            self.followers_str.append(str(uid))
        if self.description:
            self.raw_description = self.description
            self.description = (
                self.description.replace("\r\n", "<br>")
                .replace("\r", "<br>")
                .replace("\n", "<br>")
            )
