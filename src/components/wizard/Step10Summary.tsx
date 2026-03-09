import {
  CategoryScores,
  calculateOverallScore,
  getRiskColor,
  getRiskLabel,
  getRecommendation,
  RED_FLAGS,
} from '@/lib/scoring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  categories: CategoryScores;
  redFlags: Record<string, boolean>;
  partnerName: string;
}

const Step10Summary = ({ categories, redFlags, partnerName }: Props) => {
  const { score, level } = calculateOverallScore(categories, redFlags);
  const activeFlags = RED_FLAGS.filter(rf => redFlags[rf.key]);

  const radarData = [
    { subject: 'Geographic', score: categories.geographic },
    { subject: 'Labor', score: categories.labor },
    { subject: 'Safety', score: categories.safety },
    { subject: 'Human Rights', score: categories.humanRights },
    { subject: 'Transparency', score: categories.transparency },
    { subject: 'Compliance', score: categories.compliance },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Risk Assessment Summary</h2>
      <p className="text-sm text-muted-foreground">
        Complete risk profile for <strong>{partnerName || 'this partner'}</strong>.
      </p>

      {/* Overall Score */}
      <Card>
        <CardContent className="flex flex-col items-center py-8">
          <div className={cn('flex h-28 w-28 items-center justify-center rounded-full text-3xl font-bold', getRiskColor(level))}>
            {score}
          </div>
          <p className="mt-3 text-lg font-semibold">{getRiskLabel(level)}</p>
          <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
            {getRecommendation(level)}
          </p>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-base">Category Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" className="text-xs" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Risk"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid gap-2">
            {radarData.map(item => {
              const l = item.score <= 33 ? 'low' : item.score <= 66 ? 'medium' : 'high';
              return (
                <div key={item.subject} className="flex items-center justify-between rounded-lg border px-4 py-2">
                  <span className="text-sm">{item.subject}</span>
                  <Badge className={cn('text-xs', getRiskColor(l))}>{item.score}/100</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Red Flags */}
      {activeFlags.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-base text-destructive">⚠️ Critical Red Flags Identified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeFlags.map(rf => (
                <div key={rf.key} className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
                  <span>🚩</span>
                  <span>{rf.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Step10Summary;
