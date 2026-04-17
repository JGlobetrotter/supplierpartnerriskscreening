import os
import streamlit as st
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


def get_supabase() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_ANON_KEY"]
    sb = create_client(url, key)
    session = st.session_state.get("session")
    if session:
        try:
            sb.auth.set_session(session.access_token, session.refresh_token)
        except Exception:
            pass
    return sb
