import asyncio
from typing import List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, WebSocketException

from ..objects import User
from ..services import UserAuthService

router = APIRouter()


class ConnectionManager:
    active_connections: List[WebSocket] = []
    user: dict[User] = {}

    @classmethod
    async def connect(cls, websocket: WebSocket):
        await websocket.accept()
        cls.active_connections.append(websocket)

    @classmethod
    def disconnect(cls, websocket: WebSocket):
        cls.active_connections.remove(websocket)

    @classmethod
    async def send(cls, data: dict, websocket: WebSocket):
        await websocket.send_json(data)

    @classmethod
    async def broadcast(cls, data: dict):
        connections = [
            connection.send_json(data) for connection in cls.active_connections
        ]
        await asyncio.gather(*connections)

    @classmethod
    async def sendLike(cls, *, boardId: int, iliked: bool, count: int, user: User):
        connections = []
        for connection in cls.active_connections:
            if (
                connection in ConnectionManager.user
                and user.id == ConnectionManager.user[connection].id
            ):
                connections.append(
                    connection.send_json(
                        {
                            "type": "liked",
                            "data": {
                                "board_id": boardId,
                                "board_id_str": str(boardId),
                                "iliked": iliked,
                                "count": count,
                            },
                        }
                    )
                )
            else:
                connections.append(
                    connection.send_json(
                        {
                            "type": "liked",
                            "data": {
                                "board_id": boardId,
                                "board_id_str": str(boardId),
                                "iliked": False,
                                "count": count,
                            },
                        }
                    )
                )
        await asyncio.gather(*connections)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ConnectionManager.connect(websocket)
    try:
        while True:
            data: dict = await websocket.receive_json()
            if data.get("type", "") == "login":
                user: User = await UserAuthService.getUserFromStringToken(
                    data["data"]["token"]
                )
                if not user:
                    await websocket.send_json({"type": "login_failed"})
                else:
                    ConnectionManager.user[websocket] = user
                    print(f"logined {user.username}")
                    await websocket.send_json({"type": "login_success"})

            await asyncio.sleep(0)
    except WebSocketDisconnect:
        ConnectionManager.disconnect(websocket)


@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    await ConnectionManager.connect(websocket)
    user: User = await UserAuthService.getUserFromStringToken(token)
    if user:
        ConnectionManager.user[websocket] = user
        print(f"logined {user.username}")
        await websocket.send_json({"type": "login_success"})
    else:
        raise WebSocketException(1005, "wrong token")
    try:
        while True:
            data: dict = await websocket.receive_json()
            await asyncio.sleep(0)
    except WebSocketDisconnect:
        ConnectionManager.disconnect(websocket)
