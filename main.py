import importlib
from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI
from fastapi.responses import ORJSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app import Env


@asynccontextmanager
async def lifespan(app: FastAPI):
    Env.pool = await asyncpg.create_pool(Env.get("dsn"), statement_cache_size=0)
    yield


app = FastAPI(
    title="Nyanfeed",
    summary="Social Network Service",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)

app.mount("/static", StaticFiles(directory="static"), name="static")
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(importlib.import_module("app.endpoints.frontend").router)
app.include_router(importlib.import_module("app.endpoints.websocket").router)
app.include_router(importlib.import_module("app.endpoints.api.auth.register").router)
app.include_router(importlib.import_module("app.endpoints.api.auth.login").router)
app.include_router(importlib.import_module("app.endpoints.api.timeline.latest").router)
app.include_router(importlib.import_module("app.endpoints.api.boards.create").router)
app.include_router(importlib.import_module("app.endpoints.api.boards.board").router)
app.include_router(importlib.import_module("app.endpoints.api.boards.like").router)
app.include_router(importlib.import_module("app.endpoints.api.boards.replys").router)
app.include_router(importlib.import_module("app.endpoints.api.users.me").router)
app.include_router(importlib.import_module("app.endpoints.api.users.edit").router)
app.include_router(importlib.import_module("app.endpoints.api.users.follow").router)
app.include_router(importlib.import_module("app.endpoints.api.users.username").router)
app.include_router(importlib.import_module("app.endpoints.api.users.userBoards").router)
