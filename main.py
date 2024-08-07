import importlib
from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app import Env


@asynccontextmanager
async def lifespan(app: FastAPI):
    Env.pool = await asyncpg.create_pool(Env.get("dsn"))
    yield


app = FastAPI(title="Nyanfeed", summary="Social Network Service", lifespan=lifespan)

app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(importlib.import_module("app.endpoints.frontend").router)
app.include_router(importlib.import_module("app.endpoints.websocket").router)
app.include_router(importlib.import_module("app.endpoints.api.auth.register").router)
app.include_router(importlib.import_module("app.endpoints.api.auth.login").router)
app.include_router(importlib.import_module("app.endpoints.api.timeline.latest").router)
app.include_router(importlib.import_module("app.endpoints.api.boards.create").router)
app.include_router(importlib.import_module("app.endpoints.api.boards.board").router)
app.include_router(importlib.import_module("app.endpoints.api.boards.like").router)
app.include_router(importlib.import_module("app.endpoints.api.users.me").router)
