from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


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
