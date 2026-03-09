import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import {
  calculateGeographicRisk,
  calculateLaborScore,
  calculateSafetyScore,
  calculateHumanRightsScore,
  calculateTransparencyScore,
  calculateComplianceScore,
  calculateOverallScore,
  getRiskLabel,
  getRecommendation,
  RED_FLAGS,
} from '@/lib/scoring';

export async function generateScreeningPdf(screeningId: string) {
  const { data: responses } = await supabase
    .from('screening_responses')
    .select('*')
    .eq('screening_id', screeningId);

  if (!responses) return;

  const stepData: Record<number, any> = {};
  responses.forEach(r => { stepData[r.step_number] = r.response_data; });

  const categories = {
    geographic: calculateGeographicRisk(stepData[3]?.primaryCountry || '', stepData[3]?.conflictAffectedArea || false),
    labor: calculateLaborScore(stepData[4] || {}),
    safety: calculateSafetyScore(stepData[5] || {}),
    humanRights: calculateHumanRightsScore(stepData[6] || {}),
    transparency: calculateTransparencyScore(stepData[7] || {}),
    compliance: calculateComplianceScore(stepData[8] || {}),
  };

  const { score, level } = calculateOverallScore(categories, stepData[9] || {});
  const partnerName = stepData[2]?.organizationName || 'Untitled';

  const doc = new jsPDF();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Supplier Risk Screening Report', 14, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, y);
  y += 12;

  // Overall Score
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Partner: ${partnerName}`, 14, y);
  y += 8;
  doc.setFontSize(12);
  doc.text(`Overall Risk Score: ${score}/100 — ${getRiskLabel(level)}`, 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(getRecommendation(level), 14, y, { maxWidth: 180 });
  y += 16;

  // Category Breakdown
  autoTable(doc, {
    startY: y,
    head: [['Category', 'Score', 'Risk Level']],
    body: [
      ['Geographic Risk', `${categories.geographic}/100`, getRiskLabel(categories.geographic <= 33 ? 'low' : categories.geographic <= 66 ? 'medium' : 'high')],
      ['Labor Practices', `${categories.labor}/100`, getRiskLabel(categories.labor <= 33 ? 'low' : categories.labor <= 66 ? 'medium' : 'high')],
      ['Workplace Safety', `${categories.safety}/100`, getRiskLabel(categories.safety <= 33 ? 'low' : categories.safety <= 66 ? 'medium' : 'high')],
      ['Human Rights', `${categories.humanRights}/100`, getRiskLabel(categories.humanRights <= 33 ? 'low' : categories.humanRights <= 66 ? 'medium' : 'high')],
      ['Supply Chain Transparency', `${categories.transparency}/100`, getRiskLabel(categories.transparency <= 33 ? 'low' : categories.transparency <= 66 ? 'medium' : 'high')],
      ['Compliance History', `${categories.compliance}/100`, getRiskLabel(categories.compliance <= 33 ? 'low' : categories.compliance <= 66 ? 'medium' : 'high')],
    ],
    theme: 'grid',
    headStyles: { fillColor: [34, 60, 100] },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Red Flags
  const activeFlags = RED_FLAGS.filter(rf => stepData[9]?.[rf.key]);
  if (activeFlags.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Critical Red Flags', 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    activeFlags.forEach(rf => {
      doc.text(`⚠ ${rf.label}`, 18, y);
      y += 5;
    });
    y += 5;
  }

  // Partner Info
  if (stepData[2]) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Partner Information', 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const info = stepData[2];
    const fields = [
      ['Country', info.country],
      ['Sector', info.sector],
      ['Years in Operation', info.yearsInOperation],
      ['Ownership', info.ownershipStructure],
      ['Employees', info.numberOfEmployees],
    ].filter(([, v]) => v);
    fields.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 18, y);
      y += 5;
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text('Created by Navisignal — navisignal.app', 14, 285);

  doc.save(`${partnerName.replace(/\s+/g, '_')}_Risk_Report.pdf`);
}
