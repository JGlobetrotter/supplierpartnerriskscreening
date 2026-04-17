import streamlit as st
from lib.firebase_auth import sign_in, sign_up

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
                data = sign_in(email, password)
                st.session_state.user = {"uid": data["localId"], "email": data["email"]}
                st.switch_page("pages/1_Dashboard.py")
            except Exception as e:
                st.error(str(e))

with tab_up:
    with st.form("signup"):
        email2 = st.text_input("Email", key="su_email", placeholder="you@company.com")
        password2 = st.text_input("Password", type="password", key="su_pw", help="Minimum 6 characters")
        if st.form_submit_button("Create Account", use_container_width=True):
            try:
                data = sign_up(email2, password2)
                st.session_state.user = {"uid": data["localId"], "email": data["email"]}
                st.switch_page("pages/1_Dashboard.py")
            except Exception as e:
                st.error(str(e))

st.divider()
st.caption("Created by [Navisignal](https://navisignal.app)")
