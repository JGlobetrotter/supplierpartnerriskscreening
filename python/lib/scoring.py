HIGH_RISK_COUNTRIES = [
    'Afghanistan', 'Myanmar', 'North Korea', 'Syria', 'Yemen', 'Somalia',
    'South Sudan', 'Eritrea', 'Libya', 'Democratic Republic of Congo',
    'Central African Republic', 'Iraq', 'Sudan', 'Chad', 'Mali',
    'Burkina Faso', 'Niger', 'Cameroon', 'Mozambique', 'Ethiopia',
]

MEDIUM_RISK_COUNTRIES = [
    'Bangladesh', 'Cambodia', 'India', 'Pakistan', 'Vietnam', 'Indonesia',
    'Philippines', 'Thailand', 'Nigeria', 'Kenya', 'Tanzania', 'Ghana',
    'Egypt', 'Turkey', 'Mexico', 'Guatemala', 'Honduras', 'El Salvador',
    'Colombia', 'Brazil', 'Peru', 'Bolivia', 'China', 'Malaysia',
    'Nepal', 'Sri Lanka', 'Uganda', 'Zambia', 'Zimbabwe', 'Angola',
]

WEIGHTS = {
    'geographic': 0.15,
    'labor': 0.20,
    'safety': 0.15,
    'humanRights': 0.15,
    'transparency': 0.15,
    'compliance': 0.20,
}

RED_FLAGS = [
    {'key': 'childLabor', 'label': 'Child Labor'},
    {'key': 'forcedLabor', 'label': 'Forced Labor'},
    {'key': 'humanTrafficking', 'label': 'Human Trafficking'},
    {'key': 'unsafeConditions', 'label': 'Unsafe Working Conditions'},
    {'key': 'unpaidWages', 'label': 'Unpaid Wages'},
    {'key': 'unionSuppression', 'label': 'Suppression of Unions'},
]

COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Angola', 'Argentina', 'Armenia',
    'Australia', 'Austria', 'Azerbaijan', 'Bangladesh', 'Belarus', 'Belgium',
    'Bolivia', 'Bosnia and Herzegovina', 'Brazil', 'Bulgaria', 'Burkina Faso',
    'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad',
    'Chile', 'China', 'Colombia', 'Democratic Republic of Congo', 'Costa Rica',
    'Croatia', 'Czech Republic', 'Denmark', 'Dominican Republic', 'Ecuador',
    'Egypt', 'El Salvador', 'Eritrea', 'Estonia', 'Ethiopia', 'Finland',
    'France', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala',
    'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iraq', 'Ireland',
    'Israel', 'Italy', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',
    'Kuwait', 'Latvia', 'Lebanon', 'Libya', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malaysia', 'Mali', 'Mexico', 'Morocco', 'Mozambique',
    'Myanmar', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger',
    'Nigeria', 'North Korea', 'Norway', 'Pakistan', 'Panama', 'Paraguay',
    'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania',
    'Russia', 'Rwanda', 'Saudi Arabia', 'Senegal', 'Serbia', 'Singapore',
    'Slovakia', 'Slovenia', 'Somalia', 'South Africa', 'South Korea',
    'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Sweden', 'Switzerland',
    'Syria', 'Taiwan', 'Tanzania', 'Thailand', 'Tunisia', 'Turkey',
    'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
    'United States', 'Uruguay', 'Uzbekistan', 'Venezuela', 'Vietnam',
    'Yemen', 'Zambia', 'Zimbabwe',
]

INDUSTRIES = [
    'Agriculture', 'Apparel & Textiles', 'Automotive', 'Chemical',
    'Construction', 'Consumer Electronics', 'Energy & Utilities',
    'Financial Services', 'Food & Beverage', 'Healthcare & Pharma',
    'Information Technology', 'Manufacturing', 'Mining & Metals',
    'Oil & Gas', 'Retail', 'Telecommunications', 'Transportation & Logistics',
    'Other',
]


def calculate_geographic_risk(country: str, conflict_area: bool) -> int:
    score = 20
    if country in HIGH_RISK_COUNTRIES:
        score = 85
    elif country in MEDIUM_RISK_COUNTRIES:
        score = 55
    if conflict_area:
        score = min(100, score + 20)
    return score


def calculate_labor_score(data: dict) -> int:
    positives = [
        'writtenLaborPolicies', 'workerContracts', 'minimumWageCompliance',
        'maxWorkingHoursCompliance', 'grievanceMechanism', 'unionAllowed',
    ]
    count = sum(1 for k in positives if data.get(k))
    return round(100 - (count / len(positives)) * 100)


def calculate_safety_score(data: dict) -> int:
    positives = ['healthSafetyPolicy', 'safetyTraining', 'protectiveEquipment', 'incidentReporting']
    count = sum(1 for k in positives if data.get(k))
    score = round(100 - (count / len(positives)) * 100)
    if data.get('historyOfAccidents'):
        score = min(100, score + 20)
    return score


def calculate_human_rights_score(data: dict) -> int:
    positives = ['humanRightsPolicy', 'dueDiligence', 'supplierCodeOfConduct', 'humanRightsTraining']
    count = sum(1 for k in positives if data.get(k))
    return round(100 - (count / len(positives)) * 100)


def calculate_transparency_score(data: dict) -> int:
    positives = ['tracksSuppliers', 'supplierAudits', 'rawMaterialTraceability', 'highRiskMineralScreening']
    count = sum(1 for k in positives if data.get(k))
    return round(100 - (count / len(positives)) * 100)


def calculate_compliance_score(data: dict) -> int:
    negatives = ['pastLaborViolations', 'environmentalViolations', 'workerRightsLitigation', 'sanctionsExposure']
    count = sum(1 for k in negatives if data.get(k))
    return round((count / len(negatives)) * 100)


def calculate_overall_score(categories: dict, red_flags: dict) -> tuple:
    weighted = sum(categories[k] * WEIGHTS[k] for k in WEIGHTS)
    red_flag_count = sum(1 for rf in RED_FLAGS if red_flags.get(rf['key']))
    if red_flag_count > 0:
        weighted = min(100, weighted + red_flag_count * 10)
    score = round(weighted)
    level = 'low' if score <= 33 else ('medium' if score <= 66 else 'high')
    return score, level


def compute_categories(step_data: dict) -> dict:
    return {
        'geographic': calculate_geographic_risk(
            step_data.get(3, {}).get('primaryCountry', ''),
            step_data.get(3, {}).get('conflictAffectedArea', False),
        ),
        'labor': calculate_labor_score(step_data.get(4, {})),
        'safety': calculate_safety_score(step_data.get(5, {})),
        'humanRights': calculate_human_rights_score(step_data.get(6, {})),
        'transparency': calculate_transparency_score(step_data.get(7, {})),
        'compliance': calculate_compliance_score(step_data.get(8, {})),
    }


def get_risk_label(level: str) -> str:
    return {'low': 'Low Risk', 'medium': 'Medium Risk', 'high': 'High Risk'}.get(level, 'Unknown')


def get_recommendation(level: str) -> str:
    recs = {
        'low': 'Supplier acceptable with standard monitoring. Conduct periodic reviews and maintain documentation.',
        'medium': 'Supplier requires corrective action plan. Implement enhanced monitoring and request remediation within 90 days.',
        'high': 'Supplier should not be approved until remediation is verified. Immediate escalation to compliance team required.',
    }
    return recs.get(level, '')


def score_to_level(score: int) -> str:
    return 'low' if score <= 33 else ('medium' if score <= 66 else 'high')


RISK_COLORS = {'low': 'green', 'medium': 'orange', 'high': 'red'}
