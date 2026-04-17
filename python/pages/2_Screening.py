import streamlit as st
from lib.auth import require_auth
from lib.db import get_supabase
from lib.scoring import (
    COUNTRIES, INDUSTRIES, RED_FLAGS,
    compute_categories, calculate_overall_score,
)

st.set_page_config(page_title="Screening Wizard", page_icon="🛡️", layout="centered")

user = require_auth()
sb = get_supabase()

TOTAL_STEPS = 10
STEP_LABELS = [
    "User Context", "Partner Info", "Geographic Risk", "Labor Practices",
    "Workplace Safety", "Human Rights", "Supply Chain", "Compliance & Legal",
    "Red Flags", "Summary",
]

DEFAULT_DATA = {
    1: {"companyName": "", "userRole": "", "industry": "", "country": "", "relationshipType": ""},
    2: {"organizationName": "", "country": "", "sector": "", "yearsInOperation": "", "ownershipStructure": "", "numberOfEmployees": ""},
    3: {"primaryCountry": "", "regionsOfOperation": "", "conflictAffectedArea": False},
    4: {"writtenLaborPolicies": False, "workerContracts": False, "minimumWageCompliance": False, "maxWorkingHoursCompliance": False, "grievanceMechanism": False, "unionAllowed": False},
    5: {"healthSafetyPolicy": False, "safetyTraining": False, "protectiveEquipment": False, "incidentReporting": False, "historyOfAccidents": False},
    6: {"humanRightsPolicy": False, "dueDiligence": False, "supplierCodeOfConduct": False, "humanRightsTraining": False},
    7: {"tracksSuppliers": False, "supplierAudits": False, "rawMaterialTraceability": False, "highRiskMineralScreening": False},
    8: {"pastLaborViolations": False, "environmentalViolations": False, "workerRightsLitigation": False, "sanctionsExposure": False},
    9: {"childLabor": False, "forcedLabor": False, "humanTrafficking": False, "unsafeConditions": False, "unpaidWages": False, "unionSuppression": False},
    10: {},
}


def init_wizard():
    if "wizard_step" not in st.session_state:
        st.session_state.wizard_step = 1
    if "wizard_data" not in st.session_state:
        import copy
        st.session_state.wizard_data = copy.deepcopy(DEFAULT_DATA)


def load_existing(screening_id: str):
    res = sb.table("screenings").select("*").eq("id", screening_id).single().execute()
    if not res.data:
        return
    screening = res.data
    st.session_state.wizard_step = screening.get("current_step", 1)

    resp = sb.table("screening_responses").select("*").eq("screening_id", screening_id).execute()
    import copy
    data = copy.deepcopy(DEFAULT_DATA)
    for r in (resp.data or []):
        data[r["step_number"]] = r["response_data"]
    st.session_state.wizard_data = data


def save_progress(complete: bool = False):
    data = st.session_state.wizard_data
    step = st.session_state.wizard_step
    partner_name = data.get(2, {}).get("organizationName") or "Untitled"

    screening_id = st.session_state.get("screening_id")

    if not screening_id:
        res = sb.table("screenings").insert({
            "user_id": user.id,
            "partner_name": partner_name,
            "status": "draft",
            "current_step": step,
        }).execute()
        screening_id = res.data[0]["id"]
        st.session_state.screening_id = screening_id

    for s in range(1, TOTAL_STEPS + 1):
        if data.get(s) and len(data[s]) > 0:
            sb.table("screening_responses").upsert({
                "screening_id": screening_id,
                "step_number": s,
                "response_data": data[s],
            }, on_conflict="screening_id,step_number").execute()

    if complete:
        categories = compute_categories(data)
        score, level = calculate_overall_score(categories, data.get(9, {}))
        sb.table("screenings").update({
            "status": "complete",
            "partner_name": partner_name,
            "overall_score": score,
            "risk_level": level,
            "current_step": TOTAL_STEPS,
        }).eq("id", screening_id).execute()
        st.session_state.result_screening_id = screening_id
        for key in ["screening_id", "wizard_step", "wizard_data"]:
            st.session_state.pop(key, None)
        st.cache_data.clear()
        st.switch_page("pages/3_Results.py")
    else:
        sb.table("screenings").update({
            "current_step": step,
            "partner_name": partner_name,
        }).eq("id", screening_id).execute()
        st.success("Draft saved.")


def select_index(options, value):
    try:
        return options.index(value)
    except ValueError:
        return 0


# ── Init ──────────────────────────────────────────────────────────────────────
init_wizard()
screening_id = st.session_state.get("screening_id")
if screening_id and "wizard_data_loaded" not in st.session_state:
    load_existing(screening_id)
    st.session_state.wizard_data_loaded = True

step = st.session_state.wizard_step
data = st.session_state.wizard_data

# ── Header ────────────────────────────────────────────────────────────────────
hcol1, hcol2 = st.columns([3, 1])
with hcol1:
    if st.button("← Back to Dashboard"):
        st.switch_page("pages/1_Dashboard.py")
with hcol2:
    if st.button("Save Draft", use_container_width=True):
        save_progress(complete=False)

st.markdown(f"### Step {step} of {TOTAL_STEPS}: {STEP_LABELS[step - 1]}")
progress = (step - 1) / (TOTAL_STEPS - 1)
st.progress(progress)
st.divider()

# ── Steps ─────────────────────────────────────────────────────────────────────
d = data[step]

if step == 1:
    st.subheader("User Context")
    st.caption("Tell us about your company and the assessment context.")
    with st.form("step1"):
        d["companyName"] = st.text_input("Company Name", value=d.get("companyName", ""), placeholder="Your company name")
        role_opts = ["", "procurement", "esg", "compliance"]
        d["userRole"] = st.selectbox("Your Role", role_opts, index=select_index(role_opts, d.get("userRole", "")))
        ind_opts = [""] + INDUSTRIES
        d["industry"] = st.selectbox("Industry", ind_opts, index=select_index(ind_opts, d.get("industry", "")))
        country_opts = [""] + COUNTRIES
        d["country"] = st.selectbox("Country of Operation", country_opts, index=select_index(country_opts, d.get("country", "")))
        rel_opts = ["", "supplier", "partner", "subcontractor", "vendor"]
        d["relationshipType"] = st.selectbox("Relationship Type", rel_opts, index=select_index(rel_opts, d.get("relationshipType", "")))
        submitted = st.form_submit_button("Next →", use_container_width=True, type="primary")
        if submitted:
            data[1] = d
            st.session_state.wizard_step = 2
            st.rerun()

elif step == 2:
    st.subheader("Partner Basic Information")
    st.caption("Enter the details of the organization being evaluated.")
    with st.form("step2"):
        d["organizationName"] = st.text_input("Organization Name", value=d.get("organizationName", ""), placeholder="Organization name")
        country_opts = [""] + COUNTRIES
        d["country"] = st.selectbox("Country of Operation", country_opts, index=select_index(country_opts, d.get("country", "")))
        ind_opts = [""] + INDUSTRIES
        d["sector"] = st.selectbox("Sector", ind_opts, index=select_index(ind_opts, d.get("sector", "")))
        d["yearsInOperation"] = st.text_input("Years in Operation", value=d.get("yearsInOperation", ""), placeholder="e.g. 5")
        own_opts = ["", "public", "private", "state-owned", "cooperative", "joint-venture"]
        d["ownershipStructure"] = st.selectbox("Ownership Structure", own_opts, index=select_index(own_opts, d.get("ownershipStructure", "")))
        emp_opts = ["", "1-50", "51-200", "201-1000", "1001-5000", "5000+"]
        d["numberOfEmployees"] = st.selectbox("Number of Employees", emp_opts, index=select_index(emp_opts, d.get("numberOfEmployees", "")))
        c1, c2 = st.columns(2)
        back = c1.form_submit_button("← Previous", use_container_width=True)
        nxt = c2.form_submit_button("Next →", use_container_width=True, type="primary")
        if back:
            data[2] = d
            st.session_state.wizard_step = 1
            st.rerun()
        if nxt:
            data[2] = d
            st.session_state.wizard_step = 3
            st.rerun()

elif step == 3:
    st.subheader("Geographic Risk Assessment")
    st.caption("Assess the geographic risk profile of the partner's operations.")
    with st.form("step3"):
        country_opts = [""] + COUNTRIES
        d["primaryCountry"] = st.selectbox("Primary Country of Operations", country_opts, index=select_index(country_opts, d.get("primaryCountry", "")))
        d["regionsOfOperation"] = st.text_input("Regions of Operation", value=d.get("regionsOfOperation", ""), placeholder="e.g. Southeast Asia, Sub-Saharan Africa")
        d["conflictAffectedArea"] = st.checkbox("Operations in Conflict-Affected Areas", value=d.get("conflictAffectedArea", False))

        if d.get("primaryCountry"):
            from lib.scoring import calculate_geographic_risk, score_to_level, get_risk_label, RISK_COLORS
            geo_score = calculate_geographic_risk(d["primaryCountry"], d.get("conflictAffectedArea", False))
            lvl = score_to_level(geo_score)
            st.info(f"Geographic Risk Score: **{geo_score}/100** — {get_risk_label(lvl)}")

        c1, c2 = st.columns(2)
        back = c1.form_submit_button("← Previous", use_container_width=True)
        nxt = c2.form_submit_button("Next →", use_container_width=True, type="primary")
        if back:
            data[3] = d
            st.session_state.wizard_step = 2
            st.rerun()
        if nxt:
            data[3] = d
            st.session_state.wizard_step = 4
            st.rerun()

elif step == 4:
    st.subheader("Labor Practices Assessment")
    st.caption("Does the partner have the following labor practices in place?")
    with st.form("step4"):
        d["writtenLaborPolicies"] = st.checkbox("Written labor policies", value=d.get("writtenLaborPolicies", False))
        d["workerContracts"] = st.checkbox("Worker contracts", value=d.get("workerContracts", False))
        d["minimumWageCompliance"] = st.checkbox("Minimum wage compliance", value=d.get("minimumWageCompliance", False))
        d["maxWorkingHoursCompliance"] = st.checkbox("Maximum working hours compliance", value=d.get("maxWorkingHoursCompliance", False))
        d["grievanceMechanism"] = st.checkbox("Worker grievance mechanism", value=d.get("grievanceMechanism", False))
        d["unionAllowed"] = st.checkbox("Worker representation / unions allowed", value=d.get("unionAllowed", False))
        c1, c2 = st.columns(2)
        back = c1.form_submit_button("← Previous", use_container_width=True)
        nxt = c2.form_submit_button("Next →", use_container_width=True, type="primary")
        if back:
            data[4] = d
            st.session_state.wizard_step = 3
            st.rerun()
        if nxt:
            data[4] = d
            st.session_state.wizard_step = 5
            st.rerun()

elif step == 5:
    st.subheader("Workplace Safety")
    st.caption("Assess workplace health and safety practices.")
    with st.form("step5"):
        d["healthSafetyPolicy"] = st.checkbox("Health and safety policy", value=d.get("healthSafetyPolicy", False))
        d["safetyTraining"] = st.checkbox("Safety training for workers", value=d.get("safetyTraining", False))
        d["protectiveEquipment"] = st.checkbox("Protective equipment provided", value=d.get("protectiveEquipment", False))
        d["incidentReporting"] = st.checkbox("Incident reporting system", value=d.get("incidentReporting", False))
        d["historyOfAccidents"] = st.checkbox("⚠️ History of workplace accidents (increases risk score)", value=d.get("historyOfAccidents", False))
        c1, c2 = st.columns(2)
        back = c1.form_submit_button("← Previous", use_container_width=True)
        nxt = c2.form_submit_button("Next →", use_container_width=True, type="primary")
        if back:
            data[5] = d
            st.session_state.wizard_step = 4
            st.rerun()
        if nxt:
            data[5] = d
            st.session_state.wizard_step = 6
            st.rerun()

elif step == 6:
    st.subheader("Human Rights Governance")
    st.caption("Evaluate human rights policies and procedures.")
    with st.form("step6"):
        d["humanRightsPolicy"] = st.checkbox("Human rights policy", value=d.get("humanRightsPolicy", False))
        d["dueDiligence"] = st.checkbox("Due diligence procedures", value=d.get("dueDiligence", False))
        d["supplierCodeOfConduct"] = st.checkbox("Supplier code of conduct", value=d.get("supplierCodeOfConduct", False))
        d["humanRightsTraining"] = st.checkbox("Human rights training for staff", value=d.get("humanRightsTraining", False))
        c1, c2 = st.columns(2)
        back = c1.form_submit_button("← Previous", use_container_width=True)
        nxt = c2.form_submit_button("Next →", use_container_width=True, type="primary")
        if back:
            data[6] = d
            st.session_state.wizard_step = 5
            st.rerun()
        if nxt:
            data[6] = d
            st.session_state.wizard_step = 7
            st.rerun()

elif step == 7:
    st.subheader("Supply Chain Transparency")
    st.caption("Assess supply chain visibility and monitoring.")
    with st.form("step7"):
        d["tracksSuppliers"] = st.checkbox("Tracks its own suppliers", value=d.get("tracksSuppliers", False))
        d["supplierAudits"] = st.checkbox("Supplier audits conducted", value=d.get("supplierAudits", False))
        d["rawMaterialTraceability"] = st.checkbox("Raw material traceability implemented", value=d.get("rawMaterialTraceability", False))
        d["highRiskMineralScreening"] = st.checkbox("High-risk minerals / materials screened", value=d.get("highRiskMineralScreening", False))
        c1, c2 = st.columns(2)
        back = c1.form_submit_button("← Previous", use_container_width=True)
        nxt = c2.form_submit_button("Next →", use_container_width=True, type="primary")
        if back:
            data[7] = d
            st.session_state.wizard_step = 6
            st.rerun()
        if nxt:
            data[7] = d
            st.session_state.wizard_step = 8
            st.rerun()

elif step == 8:
    st.subheader("Compliance & Legal Issues")
    st.caption("Identify past compliance issues and legal exposure.")
    with st.form("step8"):
        d["pastLaborViolations"] = st.checkbox("⚠️ Past labor violations", value=d.get("pastLaborViolations", False))
        d["environmentalViolations"] = st.checkbox("⚠️ Environmental violations", value=d.get("environmentalViolations", False))
        d["workerRightsLitigation"] = st.checkbox("⚠️ Litigation related to worker rights", value=d.get("workerRightsLitigation", False))
        d["sanctionsExposure"] = st.checkbox("⚠️ Sanctions exposure", value=d.get("sanctionsExposure", False))
        c1, c2 = st.columns(2)
        back = c1.form_submit_button("← Previous", use_container_width=True)
        nxt = c2.form_submit_button("Next →", use_container_width=True, type="primary")
        if back:
            data[8] = d
            st.session_state.wizard_step = 7
            st.rerun()
        if nxt:
            data[8] = d
            st.session_state.wizard_step = 9
            st.rerun()

elif step == 9:
    st.subheader("Critical Red Flags")
    st.caption("Any confirmed flag will automatically increase the overall risk rating.")
    with st.form("step9"):
        for rf in RED_FLAGS:
            d[rf["key"]] = st.checkbox(
                f"🚩 {rf['label']}",
                value=d.get(rf["key"], False),
                help="Confirming this will escalate the risk rating",
            )
        c1, c2 = st.columns(2)
        back = c1.form_submit_button("← Previous", use_container_width=True)
        nxt = c2.form_submit_button("Next →", use_container_width=True, type="primary")
        if back:
            data[9] = d
            st.session_state.wizard_step = 8
            st.rerun()
        if nxt:
            data[9] = d
            st.session_state.wizard_step = 10
            st.rerun()

elif step == 10:
    from lib.scoring import compute_categories, calculate_overall_score, get_risk_label, get_recommendation, score_to_level, RED_FLAGS
    import plotly.graph_objects as go

    categories = compute_categories(data)
    red_flags = data.get(9, {})
    score, level = calculate_overall_score(categories, red_flags)
    partner_name = data.get(2, {}).get("organizationName") or "this partner"

    st.subheader("Risk Assessment Summary")
    st.caption(f"Complete risk profile for **{partner_name}**.")

    color_map = {"low": "#16a34a", "medium": "#d97706", "high": "#dc2626"}
    color = color_map.get(level, "#6b7280")

    st.markdown(
        f"<div style='text-align:center; padding: 24px;'>"
        f"<div style='display:inline-block; width:120px; height:120px; border-radius:50%; "
        f"background:{color}; color:white; font-size:2.2rem; font-weight:bold; "
        f"line-height:120px;'>{score}</div>"
        f"<h3 style='color:{color}; margin-top:12px;'>{get_risk_label(level)}</h3>"
        f"<p style='color:#6b7280; max-width:500px; margin:auto;'>{get_recommendation(level)}</p>"
        f"</div>",
        unsafe_allow_html=True,
    )

    st.divider()
    st.subheader("Category Breakdown")

    labels = ["Geographic", "Labor", "Safety", "Human Rights", "Transparency", "Compliance"]
    values = [
        categories["geographic"], categories["labor"], categories["safety"],
        categories["humanRights"], categories["transparency"], categories["compliance"],
    ]

    fig = go.Figure(go.Scatterpolar(
        r=values + [values[0]],
        theta=labels + [labels[0]],
        fill="toself",
        fillcolor="rgba(59,130,246,0.2)",
        line=dict(color="rgb(59,130,246)"),
    ))
    fig.update_layout(
        polar=dict(radialaxis=dict(visible=True, range=[0, 100])),
        showlegend=False,
        margin=dict(l=40, r=40, t=40, b=40),
        height=350,
    )
    st.plotly_chart(fig, use_container_width=True)

    for label, val in zip(labels, values):
        lvl = score_to_level(val)
        badge_color = color_map.get(lvl, "#6b7280")
        st.markdown(
            f"<div style='display:flex; justify-content:space-between; padding:8px 12px; "
            f"border:1px solid #e5e7eb; border-radius:6px; margin-bottom:6px;'>"
            f"<span>{label}</span>"
            f"<span style='background:{badge_color}; color:white; padding:2px 10px; "
            f"border-radius:12px; font-size:0.85rem;'>{val}/100</span></div>",
            unsafe_allow_html=True,
        )

    active_flags = [rf for rf in RED_FLAGS if red_flags.get(rf["key"])]
    if active_flags:
        st.divider()
        st.error("**Critical Red Flags Identified**")
        for rf in active_flags:
            st.markdown(f"🚩 {rf['label']}")

    st.divider()
    c1, c2, c3 = st.columns(3)
    if c1.button("← Previous", use_container_width=True):
        st.session_state.wizard_step = 9
        st.rerun()
    if c3.button("Complete Assessment ✓", use_container_width=True, type="primary"):
        save_progress(complete=True)

st.divider()
st.caption("Created by [Navisignal](https://navisignal.app)")
