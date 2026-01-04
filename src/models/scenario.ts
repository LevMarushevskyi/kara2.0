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

/**
 * Safely retrieves progress from localStorage with fallback
 */
export function getProgress(): ScenarioProgress[] {
  try {
    const stored = localStorage.getItem(PROGRESS_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);

    // Validate that parsed data is an array
    if (!Array.isArray(parsed)) {
      console.warn('Invalid progress data format, resetting...');
      return [];
    }

    // Validate each entry has required fields
    return parsed.filter((p: unknown): p is ScenarioProgress => {
      if (!p || typeof p !== 'object') return false;
      const obj = p as Record<string, unknown>;
      return (
        typeof obj.scenarioId === 'string' &&
        typeof obj.completed === 'boolean' &&
        typeof obj.stars === 'number' &&
        obj.stars >= 0 && obj.stars <= 3
      );
    });
  } catch (e) {
    console.warn('Failed to load progress from localStorage:', e);
    return [];
  }
}

/**
 * Safely saves progress to localStorage
 * Returns true if successful, false otherwise
 */
export function saveProgress(scenarioId: string, commandCount: number): boolean {
  // Validate inputs
  if (!scenarioId || typeof scenarioId !== 'string') {
    console.warn('Invalid scenarioId provided to saveProgress');
    return false;
  }

  if (typeof commandCount !== 'number' || commandCount < 0 || !Number.isFinite(commandCount)) {
    console.warn('Invalid commandCount provided to saveProgress');
    return false;
  }

  try {
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
    return true;
  } catch (e) {
    // Handle quota exceeded or other localStorage errors
    if (e instanceof DOMException && (
      e.code === 22 ||
      e.name === 'QuotaExceededError' ||
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      console.warn('localStorage quota exceeded. Progress may not be saved.');
    } else {
      console.warn('Failed to save progress:', e);
    }
    return false;
  }
}

export function getScenarioProgress(scenarioId: string): ScenarioProgress | undefined {
  if (!scenarioId || typeof scenarioId !== 'string') {
    return undefined;
  }
  return getProgress().find((p) => p.scenarioId === scenarioId);
}
