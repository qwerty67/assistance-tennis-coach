"""FastAPI application entrypoint."""
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.api.v1.routers import api_router
from app.core.config import settings
from app.core.exceptions import AppError

logging.basicConfig(level=logging.INFO)


def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION,
                  docs_url="/docs", openapi_url="/openapi.json")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials="*" not in settings.CORS_ORIGINS,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError):
        return JSONResponse(status_code=exc.status_code,
                            content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}})

    @app.exception_handler(RequestValidationError)
    async def validation_handler(_: Request, exc: RequestValidationError):
        errors = [{"field": ".".join(str(p) for p in e["loc"][1:]), "message": e["msg"]} for e in exc.errors()]
        return JSONResponse(status_code=422, content={"error": {"code": "validation_error",
                                                                "message": "Invalid input", "details": errors}})

    @app.exception_handler(IntegrityError)
    async def integrity_handler(_: Request, exc: IntegrityError):
        return JSONResponse(status_code=409, content={"error": {"code": "integrity_error",
                                                                "message": "Data conflict", "details": {}}})

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        return response

    @app.get("/health", tags=["system"])
    def health():
        return {"status": "ok", "version": settings.APP_VERSION}

    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    if settings.AUTO_CREATE_TABLES:
        from app.infrastructure.db.base import Base
        from app.infrastructure.db import models  # noqa: F401
        from app.infrastructure.db.session import engine

        Base.metadata.create_all(engine)
    return app


app = create_app()
