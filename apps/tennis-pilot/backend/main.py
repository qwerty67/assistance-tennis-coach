from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import students, matches, points, tennis_logic, analysis
from app.routers import auth as auth_router
import os
import uvicorn
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # کدهایی که موقع بالا آمدن برنامه اجرا می‌شوند
    init_db()
    print("✅ Database initialized and Tennis AI Coach API started")
    yield

# Create FastAPI app
app = FastAPI(
    title=getattr(settings, 'APP_NAME', "TennisPilot API"),
    description="AI-powered tennis coaching assistant",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(students.router, prefix="/api/students", tags=["students"])
app.include_router(matches.router, prefix="/api/matches", tags=["matches"])
app.include_router(points.router, prefix="/api/matches", tags=["points"])
app.include_router(tennis_logic.router, prefix="/api/tennis", tags=["tennis-logic"])
app.include_router(analysis.router, prefix="/api/matches", tags=["analysis"])
app.include_router(auth_router.router, prefix="/api")

# Root endpoint
@app.get("/")
def root():
    return {"message": "TennisPilot API is running"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))

    print(f"🚀 Starting server on 0.0.0.0:{port}")

    uvicorn.run(app, host="0.0.0.0", port=port)