import { cn } from '@/lib/utils';

const STEP_LABELS = [
  'Context',
  'Partner Info',
  'Geographic',
  'Labor',
  'Safety',
  'Human Rights',
  'Supply Chain',
  'Compliance',
  'Red Flags',
  'Summary',
];

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
}

const WizardProgress = ({ currentStep, totalSteps }: WizardProgressProps) => {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="mb-8 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-muted-foreground">{STEP_LABELS[currentStep - 1]}</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="hidden gap-1 md:flex">
        {STEP_LABELS.map((label, i) => (
          <div
            key={label}
            className={cn(
              'flex-1 rounded px-1 py-1 text-center text-xs transition-colors',
              i + 1 < currentStep && 'bg-primary/10 text-primary',
              i + 1 === currentStep && 'bg-primary text-primary-foreground',
              i + 1 > currentStep && 'text-muted-foreground',
            )}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WizardProgress;
