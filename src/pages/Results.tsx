import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Footer from '@/components/Footer';
import Step10Summary from '@/components/wizard/Step10Summary';
import {
  calculateGeographicRisk,
  calculateLaborScore,
  calculateSafetyScore,
  calculateHumanRightsScore,
  calculateTransparencyScore,
  calculateComplianceScore,
} from '@/lib/scoring';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Results = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stepData, setStepData] = useState<Record<number, any> | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      const { data: responses } = await supabase
        .from('screening_responses')
        .select('*')
        .eq('screening_id', id);
      if (responses) {
        const d: Record<number, any> = {};
        responses.forEach(r => { d[r.step_number] = r.response_data; });
        setStepData(d);
      }
    };
    load();
  }, [id, user]);

  if (!stepData) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  }

  const categories = {
    geographic: calculateGeographicRisk(stepData[3]?.primaryCountry || '', stepData[3]?.conflictAffectedArea || false),
    labor: calculateLaborScore(stepData[4] || {}),
    safety: calculateSafetyScore(stepData[5] || {}),
    humanRights: calculateHumanRightsScore(stepData[6] || {}),
    transparency: calculateTransparencyScore(stepData[7] || {}),
    compliance: calculateComplianceScore(stepData[8] || {}),
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      </header>
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Step10Summary
            categories={categories}
            redFlags={stepData[9] || {}}
            partnerName={stepData[2]?.organizationName || 'Unknown'}
            screeningId={id}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Results;
