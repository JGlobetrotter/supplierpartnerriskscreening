import streamlit as st
from lib.db import get_supabase

st.set_page_config(
    page_title="Supplier Risk Screening",
    page_icon="🛡️",
    layout="centered",
)

if st.session_state.get("user"):
    st.switch_page("pages/1_Dashboard.py")

st.markdown("## 🛡️ Supplier & Partner Risk Screening")
st.markdown("Sign in to conduct supplier due diligence assessments.")
st.divider()

tab_in, tab_up = st.tabs(["Sign In", "Sign Up"])

with tab_in:
    with st.form("signin"):
        email = st.text_input("Email", placeholder="you@company.com")
        password = st.text_input("Password", type="password")
        if st.form_submit_button("Sign In", use_container_width=True):
            try:
                sb = get_supabase()
                res = sb.auth.sign_in_with_password({"email": email, "password": password})
                st.session_state.user = res.user
                st.session_state.session = res.session
                st.switch_page("pages/1_Dashboard.py")
            except Exception as e:
                st.error(str(e))

with tab_up:
    with st.form("signup"):
        email2 = st.text_input("Email", key="su_email", placeholder="you@company.com")
        password2 = st.text_input("Password", type="password", key="su_pw", help="Minimum 6 characters")
        if st.form_submit_button("Create Account", use_container_width=True):
            try:
                sb = get_supabase()
                sb.auth.sign_up({"email": email2, "password": password2})
                st.success("Account created! Check your email to confirm, then sign in.")
            except Exception as e:
                st.error(str(e))

st.markdown("---")
st.caption("Created by [Navisignal](https://navisignal.app)")
