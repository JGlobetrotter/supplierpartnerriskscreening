import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { COUNTRIES, calculateGeographicRisk, getRiskColor } from '@/lib/scoring';

interface Step3Data {
  primaryCountry: string;
  regionsOfOperation: string;
  conflictAffectedArea: boolean;
}

interface Props {
  data: Step3Data;
  onChange: (data: Step3Data) => void;
}

const Step3GeographicRisk = ({ data, onChange }: Props) => {
  const update = (field: keyof Step3Data, value: any) =>
    onChange({ ...data, [field]: value });

  const geoScore = data.primaryCountry
    ? calculateGeographicRisk(data.primaryCountry, data.conflictAffectedArea)
    : null;

  const level = geoScore !== null
    ? geoScore <= 33 ? 'low' : geoScore <= 66 ? 'medium' : 'high'
    : null;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Geographic Risk Assessment</h2>
      <p className="text-sm text-muted-foreground">Assess the geographic risk profile of the partner's operations.</p>

      <div className="space-y-2">
        <Label>Primary Country of Operations</Label>
        <Select value={data.primaryCountry} onValueChange={v => update('primaryCountry', v)}>
          <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
          <SelectContent>
            {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Regions of Operation</Label>
        <Input
          value={data.regionsOfOperation}
          onChange={e => update('regionsOfOperation', e.target.value)}
          placeholder="e.g. Southeast Asia, Sub-Saharan Africa"
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <Label className="text-sm font-medium">Operations in Conflict-Affected Areas</Label>
          <p className="text-xs text-muted-foreground">Does the partner operate in conflict zones?</p>
        </div>
        <Switch
          checked={data.conflictAffectedArea}
          onCheckedChange={v => update('conflictAffectedArea', v)}
        />
      </div>

      {geoScore !== null && (
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Geographic Risk Score</span>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getRiskColor(level!)}`}>
              {geoScore}/100
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Based on child labor, forced labor, and governance risk indices.
          </p>
        </div>
      )}
    </div>
  );
};

export default Step3GeographicRisk;
