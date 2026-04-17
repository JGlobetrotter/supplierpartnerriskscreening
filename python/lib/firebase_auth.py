import os
import requests
from dotenv import load_dotenv

load_dotenv()

SIGN_IN_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
SIGN_UP_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signUp"


def _api_key() -> str:
    return os.environ["FIREBASE_API_KEY"]


def sign_in(email: str, password: str) -> dict:
    res = requests.post(
        SIGN_IN_URL,
        params={"key": _api_key()},
        json={"email": email, "password": password, "returnSecureToken": True},
    )
    data = res.json()
    if "error" in data:
        raise ValueError(data["error"]["message"].replace("_", " ").capitalize())
    return data


def sign_up(email: str, password: str) -> dict:
    res = requests.post(
        SIGN_UP_URL,
        params={"key": _api_key()},
        json={"email": email, "password": password, "returnSecureToken": True},
    )
    data = res.json()
    if "error" in data:
        raise ValueError(data["error"]["message"].replace("_", " ").capitalize())
    return data
