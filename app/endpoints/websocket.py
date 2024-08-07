from typing import List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


class ConnectionManager:
    active_connections: List[WebSocket] = []

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
        for connection in cls.active_connections:
            connection.send_json(data)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ConnectionManager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
    except WebSocketDisconnect:
        ConnectionManager.disconnect(websocket)
