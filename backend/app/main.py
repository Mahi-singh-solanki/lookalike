import os

from dotenv import load_dotenv
from fastapi import FastAPI
import socketio
from app.database import engine
from app import models
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, forms_responses
from app.realtime import sio, ensure_log_file

load_dotenv()

models.Base.metadata.create_all(engine)

fastapi_app = FastAPI(title="Lookalike")

cors_origins = [
    origin.strip()
    for origin in os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
fastapi_app.include_router(auth.router)
fastapi_app.include_router(forms_responses.router)

@fastapi_app.on_event("startup")
async def startup_event() -> None:
    await ensure_log_file()


@fastapi_app.get("/")
def LookAlike():
    return {"message": "Welcome to Lookalikes backend"}


app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
