// Geographic risk data by country (simplified)
const HIGH_RISK_COUNTRIES = [
  'Afghanistan', 'Myanmar', 'North Korea', 'Syria', 'Yemen', 'Somalia',
  'South Sudan', 'Eritrea', 'Libya', 'Democratic Republic of Congo',
  'Central African Republic', 'Iraq', 'Sudan', 'Chad', 'Mali',
  'Burkina Faso', 'Niger', 'Cameroon', 'Mozambique', 'Ethiopia',
];

const MEDIUM_RISK_COUNTRIES = [
  'Bangladesh', 'Cambodia', 'India', 'Pakistan', 'Vietnam', 'Indonesia',
  'Philippines', 'Thailand', 'Nigeria', 'Kenya', 'Tanzania', 'Ghana',
  'Egypt', 'Turkey', 'Mexico', 'Guatemala', 'Honduras', 'El Salvador',
  'Colombia', 'Brazil', 'Peru', 'Bolivia', 'China', 'Malaysia',
  'Nepal', 'Sri Lanka', 'Uganda', 'Zambia', 'Zimbabwe', 'Angola',
];

export function calculateGeographicRisk(country: string, conflictArea: boolean): number {
  let score = 20; // baseline
  if (HIGH_RISK_COUNTRIES.includes(country)) score = 85;
  else if (MEDIUM_RISK_COUNTRIES.includes(country)) score = 55;
  if (conflictArea) score = Math.min(100, score + 20);
  return score;
}

export function calculateLaborScore(data: Record<string, boolean>): number {
  const positives = [
    'writtenLaborPolicies', 'workerContracts', 'minimumWageCompliance',
    'maxWorkingHoursCompliance', 'grievanceMechanism', 'unionAllowed',
  ];
  const count = positives.filter(k => data[k]).length;
  return Math.round(100 - (count / positives.length) * 100);
}

export function calculateSafetyScore(data: Record<string, boolean>): number {
  const positives = [
    'healthSafetyPolicy', 'safetyTraining', 'protectiveEquipment',
    'incidentReporting',
  ];
  const count = positives.filter(k => data[k]).length;
  let score = Math.round(100 - (count / positives.length) * 100);
  if (data.historyOfAccidents) score = Math.min(100, score + 20);
  return score;
}

export function calculateHumanRightsScore(data: Record<string, boolean>): number {
  const positives = [
    'humanRightsPolicy', 'dueDiligence', 'supplierCodeOfConduct',
    'humanRightsTraining',
  ];
  const count = positives.filter(k => data[k]).length;
  return Math.round(100 - (count / positives.length) * 100);
}

export function calculateTransparencyScore(data: Record<string, boolean>): number {
  const positives = [
    'tracksSuppliers', 'supplierAudits', 'rawMaterialTraceability',
    'highRiskMineralScreening',
  ];
  const count = positives.filter(k => data[k]).length;
  return Math.round(100 - (count / positives.length) * 100);
}

export function calculateComplianceScore(data: Record<string, boolean>): number {
  const negatives = [
    'pastLaborViolations', 'environmentalViolations',
    'workerRightsLitigation', 'sanctionsExposure',
  ];
  const count = negatives.filter(k => data[k]).length;
  return Math.round((count / negatives.length) * 100);
}

export const RED_FLAGS = [
  { key: 'childLabor', label: 'Child Labor' },
  { key: 'forcedLabor', label: 'Forced Labor' },
  { key: 'humanTrafficking', label: 'Human Trafficking' },
  { key: 'unsafeConditions', label: 'Unsafe Working Conditions' },
  { key: 'unpaidWages', label: 'Unpaid Wages' },
  { key: 'unionSuppression', label: 'Suppression of Unions' },
] as const;

const WEIGHTS = {
  geographic: 0.15,
  labor: 0.20,
  safety: 0.15,
  humanRights: 0.15,
  transparency: 0.15,
  compliance: 0.20,
};

export interface CategoryScores {
  geographic: number;
  labor: number;
  safety: number;
  humanRights: number;
  transparency: number;
  compliance: number;
}

export function calculateOverallScore(
  categories: CategoryScores,
  redFlags: Record<string, boolean>,
): { score: number; level: 'low' | 'medium' | 'high' } {
  let weighted = 
    categories.geographic * WEIGHTS.geographic +
    categories.labor * WEIGHTS.labor +
    categories.safety * WEIGHTS.safety +
    categories.humanRights * WEIGHTS.humanRights +
    categories.transparency * WEIGHTS.transparency +
    categories.compliance * WEIGHTS.compliance;

  const redFlagCount = RED_FLAGS.filter(rf => redFlags[rf.key]).length;
  if (redFlagCount > 0) {
    weighted = Math.min(100, weighted + redFlagCount * 10);
  }

  const score = Math.round(weighted);
  const level = score <= 33 ? 'low' : score <= 66 ? 'medium' : 'high';
  return { score, level };
}

export function getRiskColor(level: string) {
  switch (level) {
    case 'low': return 'bg-risk-low text-risk-low-foreground';
    case 'medium': return 'bg-risk-medium text-risk-medium-foreground';
    case 'high': return 'bg-risk-high text-risk-high-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
}

export function getRiskLabel(level: string) {
  switch (level) {
    case 'low': return 'Low Risk';
    case 'medium': return 'Medium Risk';
    case 'high': return 'High Risk';
    default: return 'Unknown';
  }
}

export function getRecommendation(level: string) {
  switch (level) {
    case 'low':
      return 'Supplier acceptable with standard monitoring. Conduct periodic reviews and maintain documentation.';
    case 'medium':
      return 'Supplier requires corrective action plan. Implement enhanced monitoring and request remediation within 90 days.';
    case 'high':
      return 'Supplier should not be approved until remediation is verified. Immediate escalation to compliance team required.';
    default:
      return '';
  }
}

export const COUNTRIES = [
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
];

export const INDUSTRIES = [
  'Agriculture', 'Apparel & Textiles', 'Automotive', 'Chemical',
  'Construction', 'Consumer Electronics', 'Energy & Utilities',
  'Financial Services', 'Food & Beverage', 'Healthcare & Pharma',
  'Information Technology', 'Manufacturing', 'Mining & Metals',
  'Oil & Gas', 'Retail', 'Telecommunications', 'Transportation & Logistics',
  'Other',
];
