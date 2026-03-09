import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Footer from '@/components/Footer';
import { getRiskColor, getRiskLabel } from '@/lib/scoring';
import { cn } from '@/lib/utils';
import { Plus, Shield, LogOut, FileText, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';

interface Screening {
  id: string;
  partner_name: string | null;
  status: string;
  overall_score: number | null;
  risk_level: string | null;
  current_step: number;
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('screenings')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      setScreenings(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const deleteScreening = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this screening?')) return;
    await supabase.from('screening_responses').delete().eq('screening_id', id);
    await supabase.from('screenings').delete().eq('id', id);
    setScreenings(prev => prev.filter(s => s.id !== id));
  };

  const filtered = screenings.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (riskFilter !== 'all' && s.risk_level !== riskFilter) return false;
    return true;
  });

  const stats = {
    total: screenings.length,
    drafts: screenings.filter(s => s.status === 'draft').length,
    highRisk: screenings.filter(s => s.risk_level === 'high').length,
    complete: screenings.filter(s => s.status === 'complete').length,
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Risk Screening Tool</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/screening')}>
              <Plus className="mr-1 h-4 w-4" /> New Screening
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: 'Total Screenings', value: stats.total, icon: FileText, color: 'text-primary' },
              { label: 'Drafts', value: stats.drafts, icon: FileText, color: 'text-muted-foreground' },
              { label: 'Complete', value: stats.complete, icon: CheckCircle2, color: 'text-risk-low' },
              { label: 'High Risk', value: stats.highRisk, icon: AlertTriangle, color: 'text-risk-high' },
            ].map(stat => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <stat.icon className={cn('h-8 w-8', stat.color)} />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Screenings List */}
          {loading ? (
            <p className="text-center text-muted-foreground">Loading screenings...</p>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <Shield className="mb-4 h-12 w-12 text-muted-foreground/40" />
                <p className="text-lg font-medium">No screenings yet</p>
                <p className="mb-4 text-sm text-muted-foreground">Start your first risk assessment</p>
                <Button onClick={() => navigate('/screening')}>
                  <Plus className="mr-1 h-4 w-4" /> New Screening
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filtered.map(s => (
                <Card
                  key={s.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => navigate(s.status === 'draft' ? `/screening/${s.id}` : `/results/${s.id}`)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{s.partner_name || 'Untitled'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(s.updated_at).toLocaleDateString()} • Step {s.current_step}/10
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={s.status === 'draft' ? 'secondary' : 'default'}>
                        {s.status}
                      </Badge>
                      {s.risk_level && (
                        <Badge className={cn(getRiskColor(s.risk_level))}>
                          {getRiskLabel(s.risk_level)}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
