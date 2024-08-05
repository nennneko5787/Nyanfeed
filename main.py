import importlib

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Nyanfeed", summary="Social Network Service")

app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(importlib.import_module("app.endpoints.frontend").router)
app.include_router(importlib.import_module("app.endpoints.websocket").router)
app.include_router(importlib.import_module("app.endpoints.api.auth.register").router)
app.include_router(importlib.import_module("app.endpoints.api.auth.login").router)
app.include_router(importlib.import_module("app.endpoints.api.timeline.latest").router)
app.include_router(importlib.import_module("app.endpoints.api.boards.create").router)
app.include_router(importlib.import_module("app.endpoints.api.users.me").router)
