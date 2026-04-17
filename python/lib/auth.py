import streamlit as st


def require_auth():
    if not st.session_state.get("user"):
        st.warning("Please sign in to continue.")
        st.page_link("app.py", label="Go to Sign In")
        st.stop()
    return st.session_state.user
