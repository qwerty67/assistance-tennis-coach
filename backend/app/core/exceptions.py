"""Domain / application exceptions mapped to HTTP responses in main.py."""


class AppError(Exception):
    status_code = 400
    code = "bad_request"

    def __init__(self, message: str = "", code: str | None = None, details: dict | None = None):
        super().__init__(message)
        self.message = message or self.code
        if code:
            self.code = code
        self.details = details or {}


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


class ConflictError(AppError):
    status_code = 409
    code = "conflict"


class ValidationError(AppError):
    status_code = 422
    code = "validation_error"


class AuthenticationError(AppError):
    status_code = 401
    code = "unauthorized"


class PermissionDeniedError(AppError):
    status_code = 403
    code = "forbidden"


class RateLimitError(AppError):
    status_code = 429
    code = "rate_limited"
