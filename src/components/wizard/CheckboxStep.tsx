import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface CheckboxItem {
  key: string;
  label: string;
  description?: string;
  isNegative?: boolean;
}

interface Props {
  title: string;
  description: string;
  items: CheckboxItem[];
  data: Record<string, boolean>;
  onChange: (data: Record<string, boolean>) => void;
}

const CheckboxStep = ({ title, description, items, data, onChange }: Props) => {
  const toggle = (key: string) => onChange({ ...data, [key]: !data[key] });

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>

      <div className="space-y-3">
        {items.map(item => (
          <label
            key={item.key}
            className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <Checkbox
              checked={data[item.key] || false}
              onCheckedChange={() => toggle(item.key)}
              className="mt-0.5"
            />
            <div>
              <Label className="cursor-pointer text-sm font-medium">
                {item.isNegative && '⚠️ '}{item.label}
              </Label>
              {item.description && (
                <p className="text-xs text-muted-foreground">{item.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default CheckboxStep;
