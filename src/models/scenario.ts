// Scenario (Level) system for puzzle-based learning

import { World, CellType, Direction } from './types';
import { CommandType } from './program';

export interface GoalCondition {
  check: (world: World) => boolean;
  description: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  world: World;
  allowedCommands: CommandType[];
  goalCondition: GoalCondition;
  hints?: string[];
}

// Helper functions for common goal conditions
export const goalConditions = {
  collectAllClovers: (): GoalCondition => ({
    check: (world: World) => {
      return world.grid.every((row) => row.every((cell) => cell.type !== CellType.Clover));
    },
    description: 'Collect all clovers from the world',
  }),

  reachPosition: (targetX: number, targetY: number): GoalCondition => ({
    check: (world: World) => {
      return world.character.position.x === targetX && world.character.position.y === targetY;
    },
    description: `Reach position (${targetX}, ${targetY})`,
  }),

  collectCloversAndReturn: (startX: number, startY: number): GoalCondition => ({
    check: (world: World) => {
      const allCloversCollected = world.grid.every((row) =>
        row.every((cell) => cell.type !== CellType.Clover)
      );
      const atStart =
        world.character.position.x === startX && world.character.position.y === startY;
      return allCloversCollected && atStart;
    },
    description: 'Collect all clovers and return to start',
  }),

  placeCloverAtPosition: (targetX: number, targetY: number): GoalCondition => ({
    check: (world: World) => {
      return world.grid[targetY][targetX].type === CellType.Clover;
    },
    description: `Place a clover at position (${targetX}, ${targetY})`,
  }),

  inventoryEquals: (count: number): GoalCondition => ({
    check: (world: World) => {
      return world.character.inventory === count;
    },
    description: `Have exactly ${count} clover${count !== 1 ? 's' : ''} in inventory`,
  }),

  facingDirection: (direction: Direction): GoalCondition => ({
    check: (world: World) => {
      return world.character.direction === direction;
    },
    description: `Face ${direction}`,
  }),

  combined: (...conditions: GoalCondition[]): GoalCondition => ({
    check: (world: World) => {
      return conditions.every((condition) => condition.check(world));
    },
    description: conditions.map((c) => c.description).join(' AND '),
  }),
};

// Progress tracking
export interface ScenarioProgress {
  scenarioId: string;
  completed: boolean;
  stars: number; // 1-3 stars based on efficiency
  bestCommandCount?: number;
  completedAt?: string;
}

const PROGRESS_KEY = 'kara-world-progress';

export function getProgress(): ScenarioProgress[] {
  const stored = localStorage.getItem(PROGRESS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveProgress(scenarioId: string, commandCount: number): void {
  const progress = getProgress();
  const existing = progress.find((p) => p.scenarioId === scenarioId);

  const stars = commandCount <= 5 ? 3 : commandCount <= 10 ? 2 : 1;

  if (existing) {
    existing.completed = true;
    existing.stars = Math.max(existing.stars, stars);
    existing.bestCommandCount = Math.min(existing.bestCommandCount || Infinity, commandCount);
    existing.completedAt = new Date().toISOString();
  } else {
    progress.push({
      scenarioId,
      completed: true,
      stars,
      bestCommandCount: commandCount,
      completedAt: new Date().toISOString(),
    });
  }

  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function getScenarioProgress(scenarioId: string): ScenarioProgress | undefined {
  return getProgress().find((p) => p.scenarioId === scenarioId);
}
