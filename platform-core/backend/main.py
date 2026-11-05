import sys
from pathlib import Path

# Add shared-python to sys.path
SHARED_PY = Path(__file__).resolve().parent.parent / "shared-python"
if str(SHARED_PY) not in sys.path:
    sys.path.insert(0, str(SHARED_PY))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.router import router as auth_router
from app.players.router import router as students_router

app = FastAPI(
    title="Tennis Platform Core API (SSO & Shared Entities)",
    description="Central Authentication, Identity, Players and Coach-Student Relations",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth_router)
app.include_router(students_router)


@app.get("/")
def root():
    return {
        "platform": "Tennis Platform Core",
        "service": "SSO & Shared Entities",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": {
            "auth": "/api/v1/auth",
            "students": "/api/v1/students",
            "docs": "/docs",
        }
    }


@app.get("/health")
def health():
    return {"status": "ok"}
