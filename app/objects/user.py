from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, field_serializer


class User(BaseModel):
    id: int
    created_at: datetime
    username: str
    username_lower: str
    icon: str
    following: List[int]
    followers: List[int]
    display_name: str
    description: Optional[str] = None
    raw_description: Optional[str] = None

    @field_serializer("created_at")
    def convertCreatedAt(self, dt: datetime) -> str:
        return dt.isoformat()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.description:
            self.raw_description = self.description
            self.description = (
                self.description.replace("\r\n", "<br>")
                .replace("\r", "<br>")
                .replace("\n", "<br>")
            )
