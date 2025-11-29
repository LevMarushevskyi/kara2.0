// Registry of all available scenarios

import { Scenario, goalConditions } from './scenario';
import { CellType, Direction } from './types';
import { CommandType } from './program';

function createEmptyGrid(width: number, height: number) {
  return Array(height)
    .fill(null)
    .map(() =>
      Array(width)
        .fill(null)
        .map(() => ({ type: CellType.Empty }))
    );
}

export const scenarios: Scenario[] = [
  {
    id: 'level-1-first-steps',
    title: 'First Steps',
    description: 'Learn to move forward! Navigate to the clover.',
    difficulty: 'easy',
    world: {
      width: 5,
      height: 5,
      grid: (() => {
        const grid = createEmptyGrid(5, 5);
        grid[2][2] = { type: CellType.Clover };
        return grid;
      })(),
      character: {
        position: { x: 2, y: 4 },
        direction: Direction.North,
        inventory: 0,
      },
    },
    allowedCommands: [CommandType.MoveForward],
    goalCondition: goalConditions.reachPosition(2, 2),
    hints: ['Use the Move Forward command twice'],
  },

  {
    id: 'level-2-turning',
    title: 'Learning to Turn',
    description: 'Master turning! Reach the clover on your right.',
    difficulty: 'easy',
    world: {
      width: 5,
      height: 5,
      grid: (() => {
        const grid = createEmptyGrid(5, 5);
        grid[2][3] = { type: CellType.Clover };
        return grid;
      })(),
      character: {
        position: { x: 2, y: 2 },
        direction: Direction.North,
        inventory: 0,
      },
    },
    allowedCommands: [CommandType.MoveForward, CommandType.TurnRight],
    goalCondition: goalConditions.reachPosition(3, 2),
    hints: ['Turn right, then move forward'],
  },

  {
    id: 'level-3-collect',
    title: 'Clover Collector',
    description: 'Pick up the clover in front of you!',
    difficulty: 'easy',
    world: {
      width: 5,
      height: 5,
      grid: (() => {
        const grid = createEmptyGrid(5, 5);
        grid[1][2] = { type: CellType.Clover };
        return grid;
      })(),
      character: {
        position: { x: 2, y: 2 },
        direction: Direction.North,
        inventory: 0,
      },
    },
    allowedCommands: [CommandType.MoveForward, CommandType.PickClover],
    goalCondition: goalConditions.inventoryEquals(1),
    hints: ['Move forward to the clover', 'Then pick it up'],
  },

  {
    id: 'level-4-collect-all',
    title: 'Clover Garden',
    description: 'Collect all three clovers in a row!',
    difficulty: 'medium',
    world: {
      width: 6,
      height: 5,
      grid: (() => {
        const grid = createEmptyGrid(6, 5);
        grid[2][2] = { type: CellType.Clover };
        grid[2][3] = { type: CellType.Clover };
        grid[2][4] = { type: CellType.Clover };
        return grid;
      })(),
      character: {
        position: { x: 1, y: 2 },
        direction: Direction.East,
        inventory: 0,
      },
    },
    allowedCommands: [CommandType.MoveForward, CommandType.PickClover],
    goalCondition: goalConditions.collectAllClovers(),
    hints: ['Move and pick, move and pick, move and pick!'],
  },

  {
    id: 'level-5-square',
    title: 'The Square',
    description: 'Navigate around the square to collect all clovers.',
    difficulty: 'medium',
    world: {
      width: 6,
      height: 6,
      grid: (() => {
        const grid = createEmptyGrid(6, 6);
        grid[1][2] = { type: CellType.Clover };
        grid[1][3] = { type: CellType.Clover };
        grid[2][3] = { type: CellType.Clover };
        grid[3][3] = { type: CellType.Clover };
        grid[3][2] = { type: CellType.Clover };
        return grid;
      })(),
      character: {
        position: { x: 2, y: 2 },
        direction: Direction.North,
        inventory: 0,
      },
    },
    allowedCommands: [CommandType.MoveForward, CommandType.TurnRight, CommandType.PickClover],
    goalCondition: goalConditions.collectAllClovers(),
    hints: ['Think about moving in a pattern', "You'll need to turn right several times"],
  },

  {
    id: 'level-6-obstacles',
    title: 'Obstacle Course',
    description: 'Navigate around trees to collect clovers.',
    difficulty: 'medium',
    world: {
      width: 7,
      height: 5,
      grid: (() => {
        const grid = createEmptyGrid(7, 5);
        grid[2][1] = { type: CellType.Clover };
        grid[2][3] = { type: CellType.Clover };
        grid[2][5] = { type: CellType.Clover };
        grid[1][2] = { type: CellType.Tree };
        grid[3][2] = { type: CellType.Tree };
        grid[1][4] = { type: CellType.Tree };
        grid[3][4] = { type: CellType.Tree };
        return grid;
      })(),
      character: {
        position: { x: 0, y: 2 },
        direction: Direction.East,
        inventory: 0,
      },
    },
    allowedCommands: [
      CommandType.MoveForward,
      CommandType.TurnLeft,
      CommandType.TurnRight,
      CommandType.PickClover,
    ],
    goalCondition: goalConditions.collectAllClovers(),
    hints: ['Navigate around obstacles', 'Plan your path carefully'],
  },

  {
    id: 'level-7-delivery',
    title: 'Clover Delivery',
    description: 'Pick up the clover and deliver it to the marked spot!',
    difficulty: 'hard',
    world: {
      width: 7,
      height: 7,
      grid: (() => {
        const grid = createEmptyGrid(7, 7);
        grid[2][2] = { type: CellType.Clover };
        grid[4][4] = { type: CellType.Mushroom }; // Marker for delivery
        grid[3][1] = { type: CellType.Tree };
        grid[3][5] = { type: CellType.Tree };
        return grid;
      })(),
      character: {
        position: { x: 1, y: 1 },
        direction: Direction.East,
        inventory: 0,
      },
    },
    allowedCommands: [
      CommandType.MoveForward,
      CommandType.TurnLeft,
      CommandType.TurnRight,
      CommandType.PickClover,
      CommandType.PlaceClover,
    ],
    goalCondition: goalConditions.combined(
      goalConditions.reachPosition(4, 4),
      goalConditions.inventoryEquals(0),
      goalConditions.placeCloverAtPosition(4, 4)
    ),
    hints: [
      'Pick up the clover first',
      'Navigate to the mushroom (delivery point)',
      'Place the clover there',
    ],
  },

  {
    id: 'level-8-round-trip',
    title: 'Round Trip',
    description: 'Collect all clovers and return to your starting position!',
    difficulty: 'hard',
    world: {
      width: 8,
      height: 6,
      grid: (() => {
        const grid = createEmptyGrid(8, 6);
        grid[2][3] = { type: CellType.Clover };
        grid[2][4] = { type: CellType.Clover };
        grid[3][4] = { type: CellType.Clover };
        grid[1][4] = { type: CellType.Tree };
        grid[3][3] = { type: CellType.Tree };
        return grid;
      })(),
      character: {
        position: { x: 2, y: 2 },
        direction: Direction.East,
        inventory: 0,
      },
    },
    allowedCommands: [
      CommandType.MoveForward,
      CommandType.TurnLeft,
      CommandType.TurnRight,
      CommandType.PickClover,
    ],
    goalCondition: goalConditions.collectCloversAndReturn(2, 2),
    hints: [
      'Collect all clovers efficiently',
      'Remember where you started',
      'Plan the return journey',
    ],
  },
];

export function getScenarioById(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}
