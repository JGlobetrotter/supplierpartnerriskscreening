from fpdf import FPDF
from datetime import date
from .scoring import (
    compute_categories, calculate_overall_score, get_risk_label,
    get_recommendation, RED_FLAGS, score_to_level,
)


def generate_pdf_bytes(step_data: dict) -> bytes:
    categories = compute_categories(step_data)
    red_flags = step_data.get(9, {})
    score, level = calculate_overall_score(categories, red_flags)
    partner_name = step_data.get(2, {}).get('organizationName', 'Untitled')

    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    pdf.set_font('Helvetica', 'B', 20)
    pdf.cell(0, 10, 'Supplier Risk Screening Report', ln=True)
    pdf.set_font('Helvetica', '', 10)
    pdf.cell(0, 6, f'Generated: {date.today().strftime("%B %d, %Y")}', ln=True)
    pdf.ln(4)

    pdf.set_font('Helvetica', 'B', 14)
    pdf.cell(0, 8, f'Partner: {partner_name}', ln=True)
    pdf.set_font('Helvetica', 'B', 12)
    pdf.cell(0, 7, f'Overall Risk Score: {score}/100 — {get_risk_label(level)}', ln=True)
    pdf.set_font('Helvetica', '', 10)
    pdf.multi_cell(0, 5, get_recommendation(level))
    pdf.ln(6)

    pdf.set_font('Helvetica', 'B', 12)
    pdf.cell(0, 7, 'Category Breakdown', ln=True)
    pdf.set_font('Helvetica', 'B', 10)

    col_widths = [90, 30, 50]
    headers = ['Category', 'Score', 'Risk Level']
    for i, h in enumerate(headers):
        pdf.cell(col_widths[i], 7, h, border=1)
    pdf.ln()

    rows = [
        ('Geographic Risk', categories['geographic']),
        ('Labor Practices', categories['labor']),
        ('Workplace Safety', categories['safety']),
        ('Human Rights', categories['humanRights']),
        ('Supply Chain Transparency', categories['transparency']),
        ('Compliance History', categories['compliance']),
    ]
    pdf.set_font('Helvetica', '', 10)
    for label, s in rows:
        pdf.cell(col_widths[0], 6, label, border=1)
        pdf.cell(col_widths[1], 6, f'{s}/100', border=1)
        pdf.cell(col_widths[2], 6, get_risk_label(score_to_level(s)), border=1)
        pdf.ln()

    active_flags = [rf for rf in RED_FLAGS if red_flags.get(rf['key'])]
    if active_flags:
        pdf.ln(4)
        pdf.set_font('Helvetica', 'B', 12)
        pdf.cell(0, 7, 'Critical Red Flags', ln=True)
        pdf.set_font('Helvetica', '', 10)
        for rf in active_flags:
            pdf.cell(0, 6, f'  ! {rf["label"]}', ln=True)

    info = step_data.get(2, {})
    if info:
        pdf.ln(4)
        pdf.set_font('Helvetica', 'B', 12)
        pdf.cell(0, 7, 'Partner Information', ln=True)
        pdf.set_font('Helvetica', '', 10)
        fields = [
            ('Country', info.get('country')),
            ('Sector', info.get('sector')),
            ('Years in Operation', info.get('yearsInOperation')),
            ('Ownership', info.get('ownershipStructure')),
            ('Employees', info.get('numberOfEmployees')),
        ]
        for label, val in fields:
            if val:
                pdf.cell(0, 5, f'  {label}: {val}', ln=True)

    pdf.set_y(-15)
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(128, 128, 128)
    pdf.cell(0, 5, 'Created by Navisignal — navisignal.app', align='L')

    return pdf.output()
