import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES, INDUSTRIES } from '@/lib/scoring';

interface Step2Data {
  organizationName: string;
  country: string;
  sector: string;
  yearsInOperation: string;
  ownershipStructure: string;
  numberOfEmployees: string;
}

interface Props {
  data: Step2Data;
  onChange: (data: Step2Data) => void;
}

const Step2PartnerInfo = ({ data, onChange }: Props) => {
  const update = (field: keyof Step2Data, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Partner Basic Information</h2>
      <p className="text-sm text-muted-foreground">Enter the details of the organization being evaluated.</p>

      <div className="space-y-2">
        <Label>Organization Name</Label>
        <Input value={data.organizationName} onChange={e => update('organizationName', e.target.value)} placeholder="Organization name" />
      </div>

      <div className="space-y-2">
        <Label>Country of Operation</Label>
        <Select value={data.country} onValueChange={v => update('country', v)}>
          <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
          <SelectContent>
            {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Sector</Label>
        <Select value={data.sector} onValueChange={v => update('sector', v)}>
          <SelectTrigger><SelectValue placeholder="Select sector" /></SelectTrigger>
          <SelectContent>
            {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Years in Operation</Label>
        <Input type="number" value={data.yearsInOperation} onChange={e => update('yearsInOperation', e.target.value)} placeholder="e.g. 5" />
      </div>

      <div className="space-y-2">
        <Label>Ownership Structure</Label>
        <Select value={data.ownershipStructure} onValueChange={v => update('ownershipStructure', v)}>
          <SelectTrigger><SelectValue placeholder="Select structure" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="state-owned">State-Owned</SelectItem>
            <SelectItem value="cooperative">Cooperative</SelectItem>
            <SelectItem value="joint-venture">Joint Venture</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Number of Employees</Label>
        <Select value={data.numberOfEmployees} onValueChange={v => update('numberOfEmployees', v)}>
          <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1-50">1–50</SelectItem>
            <SelectItem value="51-200">51–200</SelectItem>
            <SelectItem value="201-1000">201–1,000</SelectItem>
            <SelectItem value="1001-5000">1,001–5,000</SelectItem>
            <SelectItem value="5000+">5,000+</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default Step2PartnerInfo;
