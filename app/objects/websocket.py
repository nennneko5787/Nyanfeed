from typing import Optional

import fastapi

from .user import User


class WebSocket(fastapi.WebSocket):
    user: Optional[User] = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
