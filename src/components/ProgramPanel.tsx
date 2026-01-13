import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { availableCommands, CommandType } from '@/models/program';
import {
  ArrowUp,
  RotateCcw,
  RotateCw,
  Trash2,
  Repeat,
} from 'lucide-react';
import { DragEvent } from 'react';

interface ProgramPanelProps {
  program: CommandType[];
  currentStep: number;
  isRunning: boolean;
  onAddCommand: (command: CommandType) => void;
  onRemoveCommand: (index: number) => void;
  onClearProgram: () => void;
  onRun: () => void;
  onPause: () => void;
  onStep: () => void;
  onRepeatPattern?: () => void;
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

const ProgramPanel = ({
  program,
  currentStep,
  onAddCommand,
  onRemoveCommand,
  onClearProgram,
  onRepeatPattern,
}: ProgramPanelProps) => {
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
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" id="commands-heading">
          <span className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-xs">
            📦
          </span>
          Commands
        </h3>
        <div className="grid grid-cols-2 gap-2" role="toolbar" aria-labelledby="commands-heading">
          {availableCommands.map((cmd) => (
            <div
              key={cmd.id}
              draggable
              onDragStart={(e) => handleDragStart(e, cmd.type)}
              role="button"
              tabIndex={0}
              aria-label={`Add ${getCommandLabel(cmd.type)} command to program`}
              onClick={() => onAddCommand(cmd.type)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onAddCommand(cmd.type);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg cursor-move transition-colors border border-border/50 hover:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent"
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
          <h3 className="text-sm font-semibold flex items-center gap-2" id="program-heading">
            <span className="h-6 w-6 rounded bg-accent/10 flex items-center justify-center text-xs">
              ⚡
            </span>
            Program
          </h3>
          <div className="flex items-center gap-2">
            {program.length > 0 && onRepeatPattern && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRepeatPattern}
                className="h-7 text-xs gap-1"
                aria-label="Repeat pattern in program"
              >
                <Repeat className="h-3 w-3" />
                Repeat
              </Button>
            )}
            {program.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearProgram}
                className="h-7 text-xs"
                aria-label="Clear entire program"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-1 px-1">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            role="list"
            aria-labelledby="program-heading"
            aria-label={
              program.length === 0
                ? 'Empty program. Drag commands here'
                : `Program with ${program.length} commands`
            }
            className={`min-h-[200px] rounded-lg border-2 border-dashed p-2 space-y-1 ${
              program.length === 0
                ? 'border-muted-foreground/20 bg-muted/5'
                : 'border-border bg-muted/10'
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
                  role="listitem"
                  aria-label={`Command ${index + 1}: ${getCommandLabel(cmd)}${index === currentStep ? ' (currently executing)' : ''}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-all duration-200 ${
                    index === currentStep
                      ? 'bg-green-500/20 border-green-500 ring-2 ring-green-500/30 scale-[1.02] shadow-md'
                      : index < currentStep && currentStep !== -1
                        ? 'bg-card border-border opacity-50'
                        : 'bg-card border-border hover:border-accent/30'
                  }`}
                >
                  <span className="text-xs text-muted-foreground font-mono w-5">{index + 1}.</span>
                  <span className="flex-1 flex items-center gap-2 text-sm">
                    {getCommandIcon(cmd)}
                    {getCommandLabel(cmd)}
                  </span>
                  {index === currentStep && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium animate-pulse">
                      ▶ Executing
                    </span>
                  )}
                  {index !== currentStep && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveCommand(index)}
                      className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove ${getCommandLabel(cmd)} command`}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};

export default ProgramPanel;
