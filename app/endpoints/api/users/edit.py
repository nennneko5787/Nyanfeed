from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile

from .... import Env
from ....objects import User
from ....services import UserAuthService, UserService

router = APIRouter()


@Env.limiter.limit("5/minute")
@router.put("/api/users/me/edit")
async def editUser(
    request: Request,
    displayName: str = Form(None),
    description: str = Form(None),
    icon: UploadFile = File(None),
    header: UploadFile = File(None),
    user: User = Depends(UserAuthService.getUserFromBearerToken),
):
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Bearer authentication required",
            headers={"WWW-Authenticate": 'Bearer realm="auth_required"'},
        )
    user = await UserService.edit(
        user, displayName=displayName, description=description, icon=icon, header=header
    )
    return user
