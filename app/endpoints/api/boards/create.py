from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
    BackgroundTasks,
)

from ....objects import User
from ....services import BoardService, UserAuthService
from ...websocket import ConnectionManager

router = APIRouter()


@router.put("/api/boards")
async def createBoard(
    backgroundTasks: BackgroundTasks,
    request: Request,
    content: str = Form(...),
    replyId: int = Form(None),
    reboardId: int = Form(None),
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
    _files = form.getlist("files") if form.getlist("files") is not None else []
    files = []
    for file in _files:
        if file.size > 0:
            files.append(file)
    if len(files) > 4:
        raise HTTPException(400)
    board = await BoardService.create(
        user=user, content=content, files=files, replyId=replyId, reboardId=reboardId
    )
    backgroundTasks.add_task(
        ConnectionManager.broadcast, {"type": "board", "data": board.model_dump()}
    )
    return board
