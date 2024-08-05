from typing import List, Optional

from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, Request

from ...websocket import ConnectionManager
from ....objects import User
from ....services import BoardService, UserAuthService

router = APIRouter()


@router.put("/api/boards")
async def createBoard(
    request: Request,
    content: str = Form(...),
    user: User = Depends(UserAuthService.getUserFromBearerToken),
    file: Optional[UploadFile] = File(None, include_in_schema=False),
):
    print("post")
    form = await request.form()
    print(form)
    files = form.getlist("files[]") if form.getlist("files[]") is not None else []
    print(form.get("files"))
    if form.get("files") and form.get("files").size != 0:
        files.append(form.get("files"))
    if files is None:
        files = []
    if len(files) > 4:
        raise HTTPException(400)
    board = await BoardService.create(user=user, content=content, files=files)
    await ConnectionManager.broadcast({"type": "board", "data": board.model_dump()})
    return board
