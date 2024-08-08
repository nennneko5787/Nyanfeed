import aiofiles
from fastapi import APIRouter
from fastapi.responses import FileResponse, HTMLResponse

router = APIRouter()


@router.get("/favicon.ico", response_class=FileResponse)
async def index():
    return FileResponse("./favicon.ico", media_type="image/vnd.microsoft.icon")


@router.get("/", response_class=HTMLResponse)
async def index():
    async with aiofiles.open("./pages/index.html", "r", encoding="utf-8") as f:
        return await f.read()


@router.get("/terms", response_class=HTMLResponse)
async def index():
    async with aiofiles.open("./pages/terms.html", "r", encoding="utf-8") as f:
        return await f.read()


@router.get("/privacy", response_class=HTMLResponse)
async def index():
    async with aiofiles.open("./pages/privacy.html", "r", encoding="utf-8") as f:
        return await f.read()


@router.get("/home", response_class=HTMLResponse)
@router.get("/@{username:str}/boards/{boardId:int}", response_class=HTMLResponse)
async def index():
    async with aiofiles.open("./pages/home.html", "r", encoding="utf-8") as f:
        return await f.read()
