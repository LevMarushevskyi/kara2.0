import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CommandType } from '@/models/program';
import { ArrowUp, RotateCcw, RotateCw } from 'lucide-react';

interface CommandPanelProps {
  onExecuteCommand: (command: CommandType) => void;
  allowedCommands?: CommandType[];
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

const ALL_COMMANDS = [
  CommandType.MoveForward,
  CommandType.TurnLeft,
  CommandType.TurnRight,
  CommandType.PickClover,
  CommandType.PlaceClover,
];

const CommandPanel = ({ onExecuteCommand, allowedCommands }: CommandPanelProps) => {
  const commands = allowedCommands || ALL_COMMANDS;

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" id="commands-heading">
        <span className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-xs">
          📦
        </span>
        Commands
      </h3>
      <div className="grid grid-cols-2 gap-2" role="toolbar" aria-labelledby="commands-heading">
        {commands.map((cmdType) => (
          <Button
            key={cmdType}
            onClick={() => onExecuteCommand(cmdType)}
            variant="secondary"
            className="flex items-center gap-2 h-auto py-3"
            aria-label={`Execute ${getCommandLabel(cmdType)} command`}
          >
            <span className="text-lg">{getCommandIcon(cmdType)}</span>
            <span className="text-xs font-medium">{getCommandLabel(cmdType)}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default CommandPanel;
