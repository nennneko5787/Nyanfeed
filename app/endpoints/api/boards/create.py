from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile

from ....objects import User
from ....services import BoardService, UserAuthService
from ...websocket import ConnectionManager

router = APIRouter()


@router.put("/api/boards")
async def createBoard(
    request: Request,
    content: str = Form(...),
    user: User = Depends(UserAuthService.getUserFromBearerToken),
    file: Optional[UploadFile] = File(None, include_in_schema=False),
):
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Bearer authentication required",
            headers={"WWW-Authenticate": 'Bearer realm="auth_required"'},
        )
    form = await request.form()
    files = form.getlist("files[]") if form.getlist("files[]") is not None else []
    if form.get("files") and form.get("files").size != 0:
        files.append(form.get("files"))
    if files is None:
        files = []
    if len(files) > 4:
        raise HTTPException(400)
    board = await BoardService.create(user=user, content=content, files=files)
    try:
        await ConnectionManager.broadcast({"type": "board", "data": board.model_dump()})
    except:
        pass
    return board
