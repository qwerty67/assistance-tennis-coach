from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional
import jwt

DEFAULT_ALGORITHM = "HS256"
DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES = 120  # 2 hours

def create_access_token(
    data: Dict[str, Any],
    secret_key: str,
    expires_delta: Optional[timedelta] = None,
    algorithm: str = DEFAULT_ALGORITHM,
) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"iat": now, "exp": expire, "iss": "tennis-platform-core"})
    return jwt.encode(to_encode, secret_key, algorithm=algorithm)

def verify_token(
    token: str,
    secret_key: str,
    algorithm: str = DEFAULT_ALGORITHM,
) -> Dict[str, Any]:
    return jwt.decode(token, secret_key, algorithms=[algorithm], issuer="tennis-platform-core")
