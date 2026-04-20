from __future__ import annotations

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.bootstrap import get_settings

load_dotenv()
settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    summary="Campaign retrospective system for memory-backed learning loops.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def home() -> dict[str, str]:
    return {"status": "running"}
