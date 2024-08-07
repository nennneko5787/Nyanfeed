from typing import Optional

import fastapi

from .user import User


class WebSocket(fastapi.WebSocket):
    nfuser: Optional[User] = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
