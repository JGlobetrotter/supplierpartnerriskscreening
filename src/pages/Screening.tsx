import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Footer from '@/components/Footer';
import WizardProgress from '@/components/wizard/WizardProgress';
import Step1UserContext from '@/components/wizard/Step1UserContext';
import Step2PartnerInfo from '@/components/wizard/Step2PartnerInfo';
import Step3GeographicRisk from '@/components/wizard/Step3GeographicRisk';
import CheckboxStep from '@/components/wizard/CheckboxStep';
import Step10Summary from '@/components/wizard/Step10Summary';
import FileUpload from '@/components/wizard/FileUpload';
import {
  calculateGeographicRisk,
  calculateLaborScore,
  calculateSafetyScore,
  calculateHumanRightsScore,
  calculateTransparencyScore,
  calculateComplianceScore,
  calculateOverallScore,
  RED_FLAGS,
  CategoryScores,
} from '@/lib/scoring';
import { ArrowLeft, ArrowRight, Save, CheckCircle } from 'lucide-react';

const TOTAL_STEPS = 10;

const defaultStepData: Record<number, any> = {
  1: { companyName: '', userRole: '', industry: '', country: '', relationshipType: '' },
  2: { organizationName: '', country: '', sector: '', yearsInOperation: '', ownershipStructure: '', numberOfEmployees: '' },
  3: { primaryCountry: '', regionsOfOperation: '', conflictAffectedArea: false },
  4: {
    writtenLaborPolicies: false, workerContracts: false, minimumWageCompliance: false,
    maxWorkingHoursCompliance: false, grievanceMechanism: false, unionAllowed: false,
  },
  5: {
    healthSafetyPolicy: false, safetyTraining: false, protectiveEquipment: false,
    incidentReporting: false, historyOfAccidents: false,
  },
  6: {
    humanRightsPolicy: false, dueDiligence: false, supplierCodeOfConduct: false,
    humanRightsTraining: false,
  },
  7: {
    tracksSuppliers: false, supplierAudits: false, rawMaterialTraceability: false,
    highRiskMineralScreening: false,
  },
  8: {
    pastLaborViolations: false, environmentalViolations: false,
    workerRightsLitigation: false, sanctionsExposure: false,
  },
  9: {
    childLabor: false, forcedLabor: false, humanTrafficking: false,
    unsafeConditions: false, unpaidWages: false, unionSuppression: false,
  },
  10: {},
};

const Screening = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState<Record<number, any>>({ ...defaultStepData });
  const [screeningId, setScreeningId] = useState<string | null>(id || null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load existing screening
  useEffect(() => {
    if (!id || !user) { setLoaded(true); return; }
    const load = async () => {
      const { data: screening } = await supabase
        .from('screenings')
        .select('*')
        .eq('id', id)
        .single();
      if (screening) {
        setCurrentStep(screening.current_step || 1);
        const { data: responses } = await supabase
          .from('screening_responses')
          .select('*')
          .eq('screening_id', id);
        if (responses) {
          const loaded = { ...defaultStepData };
          responses.forEach(r => {
            loaded[r.step_number] = r.response_data;
          });
          setStepData(loaded);
        }
      }
      setLoaded(true);
    };
    load();
  }, [id, user]);

  const saveProgress = async (complete = false) => {
    if (!user) return;
    setSaving(true);
    try {
      let sId = screeningId;
      if (!sId) {
        const { data, error } = await supabase
          .from('screenings')
          .insert({
            user_id: user.id,
            partner_name: stepData[2]?.organizationName || 'Untitled',
            status: 'draft',
            current_step: currentStep,
          })
          .select()
          .single();
        if (error) throw error;
        sId = data.id;
        setScreeningId(sId);
      }

      // Save all step responses
      for (let step = 1; step <= TOTAL_STEPS; step++) {
        if (stepData[step] && Object.keys(stepData[step]).length > 0) {
          await supabase
            .from('screening_responses')
            .upsert({
              screening_id: sId,
              step_number: step,
              response_data: stepData[step],
            }, { onConflict: 'screening_id,step_number' });
        }
      }

      // Calculate scores if completing
      if (complete) {
        const categories = computeCategories();
        const { score, level } = calculateOverallScore(categories, stepData[9]);
        await supabase
          .from('screenings')
          .update({
            status: 'complete',
            partner_name: stepData[2]?.organizationName || 'Untitled',
            overall_score: score,
            risk_level: level,
            current_step: TOTAL_STEPS,
          })
          .eq('id', sId);
      } else {
        await supabase
          .from('screenings')
          .update({
            current_step: currentStep,
            partner_name: stepData[2]?.organizationName || 'Untitled',
          })
          .eq('id', sId);
      }

      toast({ title: complete ? 'Assessment Complete' : 'Progress Saved' });
      if (complete) navigate('/dashboard');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const computeCategories = (): CategoryScores => ({
    geographic: calculateGeographicRisk(stepData[3]?.primaryCountry || '', stepData[3]?.conflictAffectedArea || false),
    labor: calculateLaborScore(stepData[4] || {}),
    safety: calculateSafetyScore(stepData[5] || {}),
    humanRights: calculateHumanRightsScore(stepData[6] || {}),
    transparency: calculateTransparencyScore(stepData[7] || {}),
    compliance: calculateComplianceScore(stepData[8] || {}),
  });

  const updateStep = (step: number, data: any) => {
    setStepData(prev => ({ ...prev, [step]: data }));
  };

  const next = () => { if (currentStep < TOTAL_STEPS) setCurrentStep(s => s + 1); };
  const prev = () => { if (currentStep > 1) setCurrentStep(s => s - 1); };

  if (!loaded) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1UserContext data={stepData[1]} onChange={d => updateStep(1, d)} />;
      case 2: return <Step2PartnerInfo data={stepData[2]} onChange={d => updateStep(2, d)} />;
      case 3: return <Step3GeographicRisk data={stepData[3]} onChange={d => updateStep(3, d)} />;
      case 4: return (
        <div className="space-y-6">
          <CheckboxStep
            title="Labor Practices Assessment"
            description="Does the partner have the following labor practices in place?"
            data={stepData[4]}
            onChange={d => updateStep(4, d)}
            items={[
              { key: 'writtenLaborPolicies', label: 'Written labor policies' },
              { key: 'workerContracts', label: 'Worker contracts' },
              { key: 'minimumWageCompliance', label: 'Minimum wage compliance' },
              { key: 'maxWorkingHoursCompliance', label: 'Maximum working hours compliance' },
              { key: 'grievanceMechanism', label: 'Worker grievance mechanism' },
              { key: 'unionAllowed', label: 'Worker representation / unions allowed' },
            ]}
          />
          <div className="rounded-lg border p-4">
            <p className="mb-2 text-sm font-medium">Supporting Documents</p>
            <p className="mb-3 text-xs text-muted-foreground">Upload labor policies, contracts, or audit reports as evidence.</p>
            <FileUpload
              screeningId={screeningId}
              stepKey="labor-practices"
              files={stepData[4]?.uploadedFiles || []}
              onFilesChange={(files) => updateStep(4, { ...stepData[4], uploadedFiles: files })}
            />
          </div>
        </div>
      );
      case 5: return (
        <div className="space-y-6">
          <CheckboxStep
            title="Workplace Safety"
            description="Assess workplace health and safety practices."
            data={stepData[5]}
            onChange={d => updateStep(5, d)}
            items={[
              { key: 'healthSafetyPolicy', label: 'Health and safety policy' },
              { key: 'safetyTraining', label: 'Safety training for workers' },
              { key: 'protectiveEquipment', label: 'Protective equipment provided' },
              { key: 'incidentReporting', label: 'Incident reporting system' },
              { key: 'historyOfAccidents', label: 'History of workplace accidents', isNegative: true, description: 'This increases the risk score' },
            ]}
          />
          <div className="rounded-lg border p-4">
            <p className="mb-2 text-sm font-medium">Supporting Documents</p>
            <p className="mb-3 text-xs text-muted-foreground">Upload safety policies, training records, or incident reports.</p>
            <FileUpload
              screeningId={screeningId}
              stepKey="workplace-safety"
              files={stepData[5]?.uploadedFiles || []}
              onFilesChange={(files) => updateStep(5, { ...stepData[5], uploadedFiles: files })}
            />
          </div>
        </div>
      );
      case 6: return (
        <div className="space-y-6">
          <CheckboxStep
            title="Human Rights Governance"
            description="Evaluate human rights policies and procedures."
            data={stepData[6]}
            onChange={d => updateStep(6, d)}
            items={[
              { key: 'humanRightsPolicy', label: 'Human rights policy' },
              { key: 'dueDiligence', label: 'Due diligence procedures' },
              { key: 'supplierCodeOfConduct', label: 'Supplier code of conduct' },
              { key: 'humanRightsTraining', label: 'Human rights training for staff' },
            ]}
          />
          <div className="rounded-lg border p-4">
            <p className="mb-2 text-sm font-medium">Supporting Documents</p>
            <p className="mb-3 text-xs text-muted-foreground">Upload human rights policies, due diligence reports, or codes of conduct.</p>
            <FileUpload
              screeningId={screeningId}
              stepKey="human-rights"
              files={stepData[6]?.uploadedFiles || []}
              onFilesChange={(files) => updateStep(6, { ...stepData[6], uploadedFiles: files })}
            />
          </div>
        </div>
      );
      case 7: return (
        <div className="space-y-6">
          <CheckboxStep
            title="Supply Chain Transparency"
            description="Assess supply chain visibility and monitoring."
            data={stepData[7]}
            onChange={d => updateStep(7, d)}
            items={[
              { key: 'tracksSuppliers', label: 'Tracks its own suppliers' },
              { key: 'supplierAudits', label: 'Supplier audits conducted' },
              { key: 'rawMaterialTraceability', label: 'Raw material traceability implemented' },
              { key: 'highRiskMineralScreening', label: 'High-risk minerals / materials screened' },
            ]}
          />
          <div className="rounded-lg border p-4">
            <p className="mb-2 text-sm font-medium">Supporting Documents</p>
            <p className="mb-3 text-xs text-muted-foreground">Upload supplier audit reports, traceability records, or mineral sourcing documents.</p>
            <FileUpload
              screeningId={screeningId}
              stepKey="supply-chain"
              files={stepData[7]?.uploadedFiles || []}
              onFilesChange={(files) => updateStep(7, { ...stepData[7], uploadedFiles: files })}
            />
          </div>
        </div>
      );
      case 8: return (
        <div className="space-y-6">
          <CheckboxStep
            title="Compliance & Legal Issues"
            description="Identify past compliance issues and legal exposure."
            data={stepData[8]}
            onChange={d => updateStep(8, d)}
            items={[
              { key: 'pastLaborViolations', label: 'Past labor violations', isNegative: true },
              { key: 'environmentalViolations', label: 'Environmental violations', isNegative: true },
              { key: 'workerRightsLitigation', label: 'Litigation related to worker rights', isNegative: true },
              { key: 'sanctionsExposure', label: 'Sanctions exposure', isNegative: true },
            ]}
          />
          <div className="rounded-lg border p-4">
            <p className="mb-2 text-sm font-medium">Supporting Documents</p>
            <p className="mb-3 text-xs text-muted-foreground">Upload compliance records, legal filings, or sanctions screening results.</p>
            <FileUpload
              screeningId={screeningId}
              stepKey="compliance-legal"
              files={stepData[8]?.uploadedFiles || []}
              onFilesChange={(files) => updateStep(8, { ...stepData[8], uploadedFiles: files })}
            />
          </div>
        </div>
      );
      case 9: return (
        <div className="space-y-6">
          <CheckboxStep
            title="Critical Red Flags"
            description="Confirm or deny the presence of critical risk indicators. Any confirmed flag will automatically increase the overall risk rating."
            data={stepData[9]}
            onChange={d => updateStep(9, d)}
            items={RED_FLAGS.map(rf => ({
              key: rf.key,
              label: rf.label,
              isNegative: true,
              description: 'Confirming this will escalate the risk rating',
            }))}
          />
          <div className="rounded-lg border p-4">
            <p className="mb-2 text-sm font-medium">Supporting Documents</p>
            <p className="mb-3 text-xs text-muted-foreground">Upload investigation reports, whistleblower findings, or audit evidence.</p>
            <FileUpload
              screeningId={screeningId}
              stepKey="red-flags"
              files={stepData[9]?.uploadedFiles || []}
              onFilesChange={(files) => updateStep(9, { ...stepData[9], uploadedFiles: files })}
            />
          </div>
        </div>
      );
      case 10: return (
        <Step10Summary
          categories={computeCategories()}
          redFlags={stepData[9]}
          partnerName={stepData[2]?.organizationName}
        />
      );
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to Dashboard
          </button>
          <Button variant="outline" size="sm" onClick={() => saveProgress()} disabled={saving}>
            <Save className="mr-1 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <WizardProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />
          <Card>
            <CardContent className="p-6">
              {renderStep()}

              <div className="mt-8 flex items-center justify-between">
                <Button variant="outline" onClick={prev} disabled={currentStep === 1}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Previous
                </Button>

                {currentStep < TOTAL_STEPS ? (
                  <Button onClick={next}>
                    Next <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={() => saveProgress(true)} disabled={saving} className="bg-risk-low hover:bg-risk-low/90 text-risk-low-foreground">
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Complete Assessment
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Screening;
