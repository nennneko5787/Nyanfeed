from typing import List, Optional

from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, Request

from ....objects import User
from ....services import BoardService, UserAuthService

router = APIRouter()


@router.put("/api/boards")
async def createBoard(
    request: Request,
    content: str = Form(...),
    user: User = Depends(UserAuthService.getUserFromBearerToken),
    files: Optional[List[UploadFile]] = File(None),
):
    print("post")
    form = await request.form()
    files = form.getlist("files[]")
    if files is None:
        files = []
    if len(files) > 4:
        raise HTTPException(400)
    return await BoardService.create(user=user, content=content, files=files)
