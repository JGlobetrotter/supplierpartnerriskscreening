import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()


def get_app():
    if not firebase_admin._apps:
        path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "firebase-service-account.json")
        cred = credentials.Certificate(path)
        firebase_admin.initialize_app(cred)
    return firebase_admin.get_app()


def get_db():
    get_app()
    return firestore.client()
