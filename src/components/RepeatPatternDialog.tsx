import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Repeat } from 'lucide-react';

interface RepeatPatternDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRepeat: (commandCount: number, times: number) => void;
  maxCommands: number;
}

const RepeatPatternDialog = ({
  isOpen,
  onClose,
  onRepeat,
  maxCommands,
}: RepeatPatternDialogProps) => {
  const [commandCount, setCommandCount] = useState(1);
  const [times, setTimes] = useState(2);

  const handleSubmit = () => {
    if (commandCount > 0 && commandCount <= maxCommands && times > 0) {
      onRepeat(commandCount, times);
      onClose();
      // Reset values
      setCommandCount(1);
      setTimes(2);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-accent" />
            Repeat Pattern
          </DialogTitle>
          <DialogDescription>Repeat the last N commands multiple times</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="command-count">Number of commands to repeat (from end)</Label>
            <Input
              id="command-count"
              type="number"
              min={1}
              max={maxCommands}
              value={commandCount}
              onChange={(e) => setCommandCount(parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">
              Max: {maxCommands} (total commands in program)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="times">Number of repetitions</Label>
            <Input
              id="times"
              type="number"
              min={1}
              max={20}
              value={times}
              onChange={(e) => setTimes(parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">
              This will add {commandCount * times} new commands
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={commandCount <= 0 || commandCount > maxCommands || times <= 0}
            className="gap-2"
          >
            <Repeat className="h-4 w-4" />
            Repeat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RepeatPatternDialog;
