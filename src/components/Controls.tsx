import { Button } from '@/components/ui/button';
import { ArrowUp, RotateCcw, RotateCw, RefreshCw } from 'lucide-react';

interface ControlsProps {
  onMoveForward: () => void;
  onTurnLeft: () => void;
  onTurnRight: () => void;
  onReset: () => void;
}

const Controls = ({ onMoveForward, onTurnLeft, onTurnRight, onReset }: ControlsProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Controls</h3>
        <p className="text-sm text-muted-foreground mb-4">Move the ladybug robot around the grid</p>
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={onMoveForward} size="lg" className="gap-2 w-full">
          <ArrowUp className="h-4 w-4" />
          Move Forward
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={onTurnLeft} variant="secondary" size="lg" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Turn Left
          </Button>
          <Button onClick={onTurnRight} variant="secondary" size="lg" className="gap-2">
            <RotateCw className="h-4 w-4" />
            Turn Right
          </Button>
        </div>

        <Button onClick={onReset} variant="outline" size="lg" className="gap-2 w-full mt-2">
          <RefreshCw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center mt-4 p-3 bg-muted/50 rounded-lg">
        <p className="font-medium mb-1">Legend:</p>
        <p>🐞 Ladybug Robot • ⬛ Wall • ⬜ Empty</p>
      </div>
    </div>
  );
};

export default Controls;
