import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { availableCommands, CommandType } from '@/models/program';
import { ArrowUp, RotateCcw, RotateCw, Trash2, Play, Pause, SkipForward } from 'lucide-react';
import { DragEvent } from 'react';

interface ProgrammingPanelProps {
  program: CommandType[];
  currentStep: number;
  isRunning: boolean;
  onAddCommand: (command: CommandType) => void;
  onRemoveCommand: (index: number) => void;
  onClearProgram: () => void;
  onRun: () => void;
  onPause: () => void;
  onStep: () => void;
}

const getCommandIcon = (type: CommandType) => {
  switch (type) {
    case CommandType.MoveForward:
      return <ArrowUp className="h-4 w-4" />;
    case CommandType.TurnLeft:
      return <RotateCcw className="h-4 w-4" />;
    case CommandType.TurnRight:
      return <RotateCw className="h-4 w-4" />;
    case CommandType.PickClover:
      return <span className="text-base">🍀</span>;
    case CommandType.PlaceClover:
      return <span className="text-base">⬇️</span>;
  }
};

const getCommandLabel = (type: CommandType) => {
  switch (type) {
    case CommandType.MoveForward:
      return 'Move';
    case CommandType.TurnLeft:
      return 'Left';
    case CommandType.TurnRight:
      return 'Right';
    case CommandType.PickClover:
      return 'Pick';
    case CommandType.PlaceClover:
      return 'Place';
  }
};

const ProgrammingPanel = ({
  program,
  currentStep,
  isRunning,
  onAddCommand,
  onRemoveCommand,
  onClearProgram,
  onRun,
  onPause,
  onStep,
}: ProgrammingPanelProps) => {
  const handleDragStart = (e: DragEvent<HTMLDivElement>, command: CommandType) => {
    e.dataTransfer.setData('command', command);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const command = e.dataTransfer.getData('command') as CommandType;
    if (command) {
      onAddCommand(command);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Command Palette */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-xs">📦</span>
          Commands
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {availableCommands.map((cmd) => (
            <div
              key={cmd.id}
              draggable
              onDragStart={(e) => handleDragStart(e, cmd.type)}
              className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg cursor-move transition-colors border border-border/50 hover:border-accent/50"
            >
              <span className="text-lg">{getCommandIcon(cmd.type)}</span>
              <span className="text-xs font-medium">{getCommandLabel(cmd.type)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Program Area */}
      <Card className="flex-1 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className="h-6 w-6 rounded bg-accent/10 flex items-center justify-center text-xs">⚡</span>
            Program
          </h3>
          {program.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearProgram}
              className="h-7 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 -mx-1 px-1">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`min-h-[200px] rounded-lg border-2 border-dashed p-2 space-y-1 ${
              program.length === 0 ? 'border-muted-foreground/20 bg-muted/5' : 'border-border bg-muted/10'
            }`}
          >
            {program.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                Drag commands here
              </div>
            ) : (
              program.map((cmd, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-all ${
                    index === currentStep
                      ? 'bg-accent text-accent-foreground border-accent shadow-md scale-105'
                      : 'bg-card border-border hover:border-accent/30'
                  }`}
                >
                  <span className="text-xs text-muted-foreground font-mono w-5">
                    {index + 1}.
                  </span>
                  <span className="flex-1 flex items-center gap-2 text-sm">
                    {getCommandIcon(cmd)}
                    {getCommandLabel(cmd)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveCommand(index)}
                    className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    ×
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Execution Controls */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Execution</h3>
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={isRunning ? onPause : onRun}
            disabled={program.length === 0}
            size="sm"
            variant={isRunning ? 'destructive' : 'default'}
            className="gap-2"
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run
              </>
            )}
          </Button>
          <Button
            onClick={onStep}
            disabled={program.length === 0 || isRunning}
            size="sm"
            variant="secondary"
            className="gap-2 col-span-2"
          >
            <SkipForward className="h-4 w-4" />
            Step
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProgrammingPanel;
