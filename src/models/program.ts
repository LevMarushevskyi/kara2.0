// Program execution logic

export enum CommandType {
  MoveForward = 'MOVE_FORWARD',
  TurnLeft = 'TURN_LEFT',
  TurnRight = 'TURN_RIGHT',
  PickClover = 'PICK_CLOVER',
  PlaceClover = 'PLACE_CLOVER',
}

export interface Command {
  id: string;
  type: CommandType;
  label: string;
  icon: string;
}

export const availableCommands: Command[] = [
  { id: 'move', type: CommandType.MoveForward, label: 'Move Forward', icon: '↑' },
  { id: 'left', type: CommandType.TurnLeft, label: 'Turn Left', icon: '↺' },
  { id: 'right', type: CommandType.TurnRight, label: 'Turn Right', icon: '↻' },
  { id: 'pick', type: CommandType.PickClover, label: 'Pick Clover', icon: '🍀' },
  { id: 'place', type: CommandType.PlaceClover, label: 'Place Clover', icon: '⬇' },
];

export interface Program {
  commands: CommandType[];
  currentStep: number;
  isRunning: boolean;
}

export function createProgram(): Program {
  return {
    commands: [],
    currentStep: -1,
    isRunning: false,
  };
}
