from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Tennis Platform Core API",
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

@app.get("/")
def root():
    return {
        "platform": "Tennis Platform Core",
        "version": "1.0.0",
        "status": "healthy",
    }

@app.get("/health")
def health():
    return {"status": "ok"}
