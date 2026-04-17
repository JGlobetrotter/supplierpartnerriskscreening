import streamlit as st
from datetime import datetime
from lib.auth import require_auth
from lib.firebase_client import get_db
from lib.scoring import get_risk_label
from lib.pdf import generate_pdf_bytes

st.set_page_config(page_title="Dashboard — Risk Screening", page_icon="🛡️", layout="wide")

user = require_auth()
db = get_db()

# Header
col_title, col_actions = st.columns([3, 1])
with col_title:
    st.markdown("## 🛡️ Risk Screening Dashboard")
    st.caption(f"Signed in as {user['email']}")
with col_actions:
    if st.button("+ New Screening", use_container_width=True, type="primary"):
        for key in ["screening_id", "wizard_step", "wizard_data", "wizard_data_loaded"]:
            st.session_state.pop(key, None)
        st.switch_page("pages/2_Screening.py")
    if st.button("Sign Out", use_container_width=True):
        for key in ["user", "screening_id", "wizard_step", "wizard_data", "wizard_data_loaded", "result_screening_id"]:
            st.session_state.pop(key, None)
        st.switch_page("app.py")

st.divider()


def load_screenings(user_id: str):
    docs = db.collection("screenings").where("user_id", "==", user_id).order_by("updated_at", direction="DESCENDING").stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]


screenings = load_screenings(user["uid"])

# Stats
total = len(screenings)
drafts = sum(1 for s in screenings if s.get("status") == "draft")
complete = sum(1 for s in screenings if s.get("status") == "complete")
high_risk = sum(1 for s in screenings if s.get("risk_level") == "high")

c1, c2, c3, c4 = st.columns(4)
c1.metric("Total Screenings", total)
c2.metric("Drafts", drafts)
c3.metric("Complete", complete)
c4.metric("High Risk", high_risk)

st.divider()

# Filters
fc1, fc2 = st.columns(2)
with fc1:
    status_filter = st.selectbox("Status", ["All", "draft", "complete"])
with fc2:
    risk_filter = st.selectbox("Risk Level", ["All", "low", "medium", "high"])

filtered = [
    s for s in screenings
    if (status_filter == "All" or s.get("status") == status_filter)
    and (risk_filter == "All" or s.get("risk_level") == risk_filter)
]

st.markdown(f"**{len(filtered)} screening(s)**")

if not filtered:
    st.info("No screenings found. Start a new assessment above.")
else:
    for s in filtered:
        with st.container(border=True):
            row1, row2 = st.columns([4, 2])
            with row1:
                name = s.get("partner_name") or "Untitled"
                status_badge = "🟡 Draft" if s.get("status") == "draft" else "✅ Complete"
                risk = s.get("risk_level")
                risk_badge = ""
                if risk:
                    emoji = {"low": "🟢", "medium": "🟠", "high": "🔴"}.get(risk, "")
                    risk_badge = f" · {emoji} {get_risk_label(risk)}"
                    if s.get("overall_score") is not None:
                        risk_badge += f" ({s['overall_score']}/100)"
                st.markdown(f"**{name}** &nbsp;&nbsp; {status_badge}{risk_badge}")

                updated = s.get("updated_at")
                if updated:
                    if hasattr(updated, "strftime"):
                        date_str = updated.strftime("%b %d, %Y")
                    else:
                        date_str = str(updated)[:10]
                    st.caption(f"Updated {date_str} · Step {s.get('current_step', 1)}/10")

            with row2:
                btn_cols = st.columns(3)
                if s.get("status") == "draft":
                    if btn_cols[0].button("Continue", key=f"cont_{s['id']}"):
                        st.session_state.screening_id = s["id"]
                        for key in ["wizard_step", "wizard_data", "wizard_data_loaded"]:
                            st.session_state.pop(key, None)
                        st.switch_page("pages/2_Screening.py")
                else:
                    if btn_cols[0].button("View", key=f"view_{s['id']}"):
                        st.session_state.result_screening_id = s["id"]
                        st.switch_page("pages/3_Results.py")

                if s.get("status") == "complete":
                    if btn_cols[1].button("PDF", key=f"pdf_{s['id']}"):
                        resp_docs = db.collection("screenings").document(s["id"]).collection("responses").stream()
                        step_data = {int(r.id): r.to_dict().get("response_data", {}) for r in resp_docs}
                        pdf_bytes = generate_pdf_bytes(step_data)
                        fname = (s.get("partner_name") or "report").replace(" ", "_")
                        st.download_button(
                            "Download",
                            data=bytes(pdf_bytes),
                            file_name=f"{fname}_Risk_Report.pdf",
                            mime="application/pdf",
                            key=f"dl_{s['id']}",
                        )

                if btn_cols[2].button("🗑", key=f"del_{s['id']}"):
                    resp_docs = db.collection("screenings").document(s["id"]).collection("responses").stream()
                    for r in resp_docs:
                        r.reference.delete()
                    db.collection("screenings").document(s["id"]).delete()
                    st.rerun()

st.divider()
st.caption("Created by [Navisignal](https://navisignal.app)")
