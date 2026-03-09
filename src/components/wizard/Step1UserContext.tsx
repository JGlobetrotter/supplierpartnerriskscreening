import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES, INDUSTRIES } from '@/lib/scoring';

interface Step1Data {
  companyName: string;
  userRole: string;
  industry: string;
  country: string;
  relationshipType: string;
}

interface Props {
  data: Step1Data;
  onChange: (data: Step1Data) => void;
}

const Step1UserContext = ({ data, onChange }: Props) => {
  const update = (field: keyof Step1Data, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">User Context</h2>
      <p className="text-sm text-muted-foreground">Tell us about your company and the assessment context.</p>

      <div className="space-y-2">
        <Label>Company Name</Label>
        <Input value={data.companyName} onChange={e => update('companyName', e.target.value)} placeholder="Your company name" />
      </div>

      <div className="space-y-2">
        <Label>Your Role</Label>
        <Select value={data.userRole} onValueChange={v => update('userRole', v)}>
          <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="procurement">Procurement</SelectItem>
            <SelectItem value="esg">ESG</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Industry</Label>
        <Select value={data.industry} onValueChange={v => update('industry', v)}>
          <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
          <SelectContent>
            {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>
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
        <Label>Relationship Type</Label>
        <Select value={data.relationshipType} onValueChange={v => update('relationshipType', v)}>
          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="supplier">Supplier</SelectItem>
            <SelectItem value="partner">Partner</SelectItem>
            <SelectItem value="subcontractor">Subcontractor</SelectItem>
            <SelectItem value="vendor">Vendor</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default Step1UserContext;
