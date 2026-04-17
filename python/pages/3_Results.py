import streamlit as st
import plotly.graph_objects as go
from lib.auth import require_auth
from lib.firebase_client import get_db
from lib.scoring import (
    compute_categories, calculate_overall_score,
    get_risk_label, get_recommendation, score_to_level, RED_FLAGS,
)
from lib.pdf import generate_pdf_bytes

st.set_page_config(page_title="Screening Results", page_icon="🛡️", layout="centered")

user = require_auth()
db = get_db()

if st.button("← Back to Dashboard"):
    st.switch_page("pages/1_Dashboard.py")

screening_id = st.session_state.get("result_screening_id")
if not screening_id:
    st.error("No screening selected.")
    st.stop()

resp_docs = db.collection("screenings").document(screening_id).collection("responses").stream()
step_data = {int(r.id): r.to_dict().get("response_data", {}) for r in resp_docs}

if not step_data:
    st.error("Screening data not found.")
    st.stop()

categories = compute_categories(step_data)
red_flags = step_data.get(9, {})
score, level = calculate_overall_score(categories, red_flags)
partner_name = step_data.get(2, {}).get("organizationName") or "this partner"

color_map = {"low": "#16a34a", "medium": "#d97706", "high": "#dc2626"}
color = color_map.get(level, "#6b7280")

st.subheader("Risk Assessment Summary")
st.caption(f"Complete risk profile for **{partner_name}**.")
st.markdown(
    f"<div style='text-align:center;padding:24px;'>"
    f"<div style='display:inline-block;width:120px;height:120px;border-radius:50%;"
    f"background:{color};color:white;font-size:2.2rem;font-weight:bold;line-height:120px;'>{score}</div>"
    f"<h3 style='color:{color};margin-top:12px;'>{get_risk_label(level)}</h3>"
    f"<p style='color:#6b7280;max-width:500px;margin:auto;'>{get_recommendation(level)}</p></div>",
    unsafe_allow_html=True,
)

st.divider()
st.subheader("Category Breakdown")

labels = ["Geographic", "Labor", "Safety", "Human Rights", "Transparency", "Compliance"]
values = [categories["geographic"], categories["labor"], categories["safety"], categories["humanRights"], categories["transparency"], categories["compliance"]]

fig = go.Figure(go.Scatterpolar(
    r=values + [values[0]], theta=labels + [labels[0]],
    fill="toself", fillcolor="rgba(59,130,246,0.2)", line=dict(color="rgb(59,130,246)"),
))
fig.update_layout(polar=dict(radialaxis=dict(visible=True, range=[0, 100])), showlegend=False, margin=dict(l=40, r=40, t=40, b=40), height=350)
st.plotly_chart(fig, use_container_width=True)

for label, val in zip(labels, values):
    badge_color = color_map.get(score_to_level(val), "#6b7280")
    st.markdown(
        f"<div style='display:flex;justify-content:space-between;padding:8px 12px;"
        f"border:1px solid #e5e7eb;border-radius:6px;margin-bottom:6px;'>"
        f"<span>{label}</span><span style='background:{badge_color};color:white;"
        f"padding:2px 10px;border-radius:12px;font-size:0.85rem;'>{val}/100</span></div>",
        unsafe_allow_html=True,
    )

active_flags = [rf for rf in RED_FLAGS if red_flags.get(rf["key"])]
if active_flags:
    st.divider()
    st.error("**Critical Red Flags Identified**")
    for rf in active_flags:
        st.markdown(f"🚩 {rf['label']}")

st.divider()
pdf_bytes = generate_pdf_bytes(step_data)
fname = partner_name.replace(" ", "_")
st.download_button(
    label="Download PDF Report",
    data=bytes(pdf_bytes),
    file_name=f"{fname}_Risk_Report.pdf",
    mime="application/pdf",
    use_container_width=True,
    type="primary",
)

st.divider()
st.caption("Created by [Navisignal](https://navisignal.app)")
