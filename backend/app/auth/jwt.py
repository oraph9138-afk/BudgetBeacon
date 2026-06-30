from datetime import datetime, timedelta
from jose import JWTError, jwt

SECRET_KEY = "budgetbeacon-secret-key-change-in-production"
ALGORITHM = "HS256"
EXPIRE_HOURS = 24


def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(hours=EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
