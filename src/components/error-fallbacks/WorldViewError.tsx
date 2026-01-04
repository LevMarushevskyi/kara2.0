import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorldViewErrorProps {
  onReset: () => void;
}

export function WorldViewError({ onReset }: WorldViewErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-destructive/5 rounded-lg border border-destructive/20">
      <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
      <h2 className="text-lg font-semibold text-foreground mb-2">World View Error</h2>
      <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
        Something went wrong while rendering the world. This might be due to invalid world data.
      </p>
      <Button onClick={onReset} variant="outline" size="sm" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Reset World
      </Button>
    </div>
  );
}
