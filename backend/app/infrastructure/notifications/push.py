"""Push notification gateway abstraction.

V1 stores notifications in DB (in-app inbox). `ExpoPushGateway` can be enabled later
(EXPO push service -> FCM/APNs) without touching application services.
"""
import json
import logging
import urllib.request
from typing import Protocol

log = logging.getLogger("push")


class PushGateway(Protocol):
    def send(self, tokens: list[str], title: str, body: str, data: dict) -> None: ...


class NullPushGateway:
    def send(self, tokens, title, body, data):
        log.debug("push skipped (null gateway): %s", title)


class ExpoPushGateway:
    URL = "https://exp.host/--/api/v2/push/send"

    def send(self, tokens, title, body, data):
        if not tokens:
            return
        payload = [{"to": t, "title": title, "body": body, "data": data, "sound": "default"} for t in tokens]
        req = urllib.request.Request(
            self.URL, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"}
        )
        try:
            urllib.request.urlopen(req, timeout=5)  # noqa: S310
        except Exception as exc:  # pragma: no cover - network
            log.warning("expo push failed: %s", exc)


def get_push_gateway() -> PushGateway:
    import os

    return ExpoPushGateway() if os.getenv("PUSH_PROVIDER") == "expo" else NullPushGateway()
