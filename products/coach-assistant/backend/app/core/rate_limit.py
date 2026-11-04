"""Simple in-memory sliding-window rate limiter (per IP + route).

For multi-instance deployments swap the storage for Redis; the interface stays the same.
"""
import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import Request

from app.core.config import settings
from app.core.exceptions import RateLimitError


class SlidingWindowLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def hit(self, key: str, limit: int, window_seconds: int) -> bool:
        now = time.monotonic()
        with self._lock:
            q = self._hits[key]
            while q and now - q[0] > window_seconds:
                q.popleft()
            if len(q) >= limit:
                return False
            q.append(now)
            return True

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


limiter = SlidingWindowLimiter()


def rate_limit(limit: int | None = None, window_seconds: int = 60):
    """FastAPI dependency factory used on sensitive endpoints (login, register, refresh)."""

    def dependency(request: Request) -> None:
        if not settings.RATE_LIMIT_ENABLED:
            return
        client = request.client.host if request.client else "unknown"
        key = f"{client}:{request.url.path}"
        if not limiter.hit(key, limit or settings.RATE_LIMIT_AUTH_PER_MINUTE, window_seconds):
            raise RateLimitError("Too many requests, please try again later.")

    return dependency
