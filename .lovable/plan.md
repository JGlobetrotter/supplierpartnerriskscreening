

# Supplier & Partner Risk Screening Tool

## Overview
A professional multi-step assessment wizard that helps companies screen suppliers and partners for labor, human rights, and compliance risks. Features user authentication, a 10-step wizard with scoring engine, and a risk dashboard.

## Authentication
- Email/password signup and login
- User profiles storing company name, role, and industry
- Protected routes requiring authentication

## Database Structure
- **profiles** — user info (company, role, industry)
- **screenings** — each assessment record with status (draft/complete), overall score, risk level, timestamps
- **screening_responses** — step-by-step answers stored as JSON per step

## 10-Step Wizard
Each step is a form card with progress bar at the top showing completion (Step X of 10).

1. **User Context** — Company name, role selector, industry, country, relationship type
2. **Partner Basic Info** — Org name, country, sector, years in operation, ownership, employee count
3. **Geographic Risk** — Country/region selection, conflict-area toggle; auto-calculated geo risk score
4. **Labor Practices** — Checkbox questionnaire (policies, contracts, wages, grievance mechanisms); flags risks
5. **Workplace Safety** — H&S policy, training, PPE, incident reporting, accident history
6. **Human Rights Governance** — HR policy, due diligence, code of conduct, training
7. **Supply Chain Transparency** — Supplier tracking, audits, traceability, mineral screening
8. **Compliance & Legal** — Past violations, litigation, sanctions exposure
9. **Critical Red Flags** — Child labor, forced labor, trafficking, unsafe conditions, unpaid wages, union suppression; auto-escalates risk
10. **Risk Scoring Summary** — Weighted score calculation across all categories, final risk level display

## Scoring Engine
- Each category scored 0–100 with predefined weights
- Red flags from Step 9 automatically increase overall risk
- Final classification: 🟢 Low (0–33) / 🟡 Medium (34–66) / 🔴 High (67–100)

## Results Page
- Overall risk score with traffic-light visual
- Category breakdown with bar/radar chart
- Red flags list with severity indicators
- Action recommendations based on risk tier

## Dashboard
- Table/card list of all screenings
- Columns: Partner name, status (draft/complete), risk level badge, date
- Filter by status and risk level
- Click to view results or resume draft

## UI & Design
- Clean, professional look with neutral tones suitable for ESG/compliance teams
- Progress stepper with numbered steps
- Card-based layout throughout
- Traffic light color coding (green/yellow/red) for risk levels
- Footer: "Created by Navisignal" linked to navisignal.app
- Fully responsive

## Tech Approach
- Supabase (via Lovable Cloud) for auth, database, and RLS
- React with shadcn/ui components
- Recharts for score visualizations
- React Router for navigation between dashboard, wizard, and results

