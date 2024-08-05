import aiofiles
from fastapi import APIRouter
from fastapi.responses import HTMLResponse, FileResponse

router = APIRouter()


@router.get("/favicon.ico", response_class=FileResponse)
async def index():
    return FileResponse("./favicon.ico", media_type="image/vnd.microsoft.icon")


@router.get("/", response_class=HTMLResponse)
async def index():
    async with aiofiles.open("./pages/index.html", "r", encoding="utf-8") as f:
        return await f.read()


@router.get("/home", response_class=HTMLResponse)
async def index():
    async with aiofiles.open("./pages/home.html", "r", encoding="utf-8") as f:
        return await f.read()
