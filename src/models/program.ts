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

/**
 * Repeat the last N commands in a program X times
 * @param program - The current program
 * @param commandCount - Number of commands to repeat from the end
 * @param times - Number of times to repeat
 * @returns New program with repeated commands
 */
export function repeatLastCommands(
  program: CommandType[],
  commandCount: number,
  times: number
): CommandType[] {
  if (commandCount <= 0 || times <= 0 || commandCount > program.length) {
    return program;
  }

  const commandsToRepeat = program.slice(-commandCount);
  const newCommands: CommandType[] = [];

  for (let i = 0; i < times; i++) {
    newCommands.push(...commandsToRepeat);
  }

  return [...program, ...newCommands];
}

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
