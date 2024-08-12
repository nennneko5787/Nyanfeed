import re
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
    header: Optional[str] = None
    following: List[int]
    following_str: List[str] = []
    followers: List[int]
    followers_str: List[str] = []
    display_name: str
    description: Optional[str] = None
    raw_description: Optional[str] = None
    badges: List[str]
    freezed: bool = False

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
            url_pattern = re.compile(
                r"(http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+)"
            )
            self.description = url_pattern.sub(r'<a href="\1">\1</a>', self.description)
            self.description = re.sub(
                r"(@[a-zA-Z0-9_.]+)",
                r"""<a onclick="event.stopPropagation(); router('/\1', 'profile');">\1</a>""",
                self.description,
            )
            self.description = (
                self.description.replace("\r\n", "<br>")
                .replace("\r", "<br>")
                .replace("\n", "<br>")
            )
