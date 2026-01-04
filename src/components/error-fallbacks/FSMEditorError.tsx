import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FSMEditorErrorProps {
  onReset: () => void;
}

export function FSMEditorError({ onReset }: FSMEditorErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-6 bg-destructive/5 rounded-lg border border-destructive/20">
      <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
      <h2 className="text-base font-semibold text-foreground mb-2">FSM Editor Error</h2>
      <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
        The state machine editor encountered an error. Try resetting to a blank FSM.
      </p>
      <Button onClick={onReset} variant="outline" size="sm" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Reset FSM
      </Button>
    </div>
  );
}
