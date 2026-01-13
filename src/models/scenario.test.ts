import { describe, it, expect, beforeEach } from 'vitest';
import { goalConditions, saveProgress, getProgress, getScenarioProgress } from './scenario';
import { World, CellType, Direction } from './types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('Scenario Model', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('goalConditions', () => {
    describe('collectAllClovers', () => {
      it('should return true when all clovers are collected', () => {
        const grid = Array(3)
          .fill(null)
          .map(() =>
            Array(3)
              .fill(null)
              .map(() => ({ type: CellType.Empty }))
          );

        const world: World = {
          width: 3,
          height: 3,
          grid,
          character: {
            position: { x: 1, y: 1 },
            direction: Direction.North,
          },
        };

        const condition = goalConditions.collectAllClovers();
        expect(condition.check(world)).toBe(true);
      });

      it('should return false when clovers remain', () => {
        const grid = Array(3)
          .fill(null)
          .map(() =>
            Array(3)
              .fill(null)
              .map(() => ({ type: CellType.Empty }))
          );
        grid[1][1] = { type: CellType.Clover };

        const world: World = {
          width: 3,
          height: 3,
          grid,
          character: {
            position: { x: 0, y: 0 },
            direction: Direction.North,
          },
        };

        const condition = goalConditions.collectAllClovers();
        expect(condition.check(world)).toBe(false);
      });

      it('should have correct description', () => {
        const condition = goalConditions.collectAllClovers();
        expect(condition.description).toBe('Collect all clovers from the world');
      });
    });

    describe('reachPosition', () => {
      it('should return true when character is at target position', () => {
        const world: World = {
          width: 5,
          height: 5,
          grid: Array(5)
            .fill(null)
            .map(() => Array(5).fill({ type: CellType.Empty })),
          character: {
            position: { x: 3, y: 2 },
            direction: Direction.North,
          },
        };

        const condition = goalConditions.reachPosition(3, 2);
        expect(condition.check(world)).toBe(true);
      });

      it('should return false when character is not at target position', () => {
        const world: World = {
          width: 5,
          height: 5,
          grid: Array(5)
            .fill(null)
            .map(() => Array(5).fill({ type: CellType.Empty })),
          character: {
            position: { x: 1, y: 1 },
            direction: Direction.North,
          },
        };

        const condition = goalConditions.reachPosition(3, 2);
        expect(condition.check(world)).toBe(false);
      });

      it('should have correct description', () => {
        const condition = goalConditions.reachPosition(3, 2);
        expect(condition.description).toBe('Reach position (3, 2)');
      });
    });

    describe('collectCloversAndReturn', () => {
      it('should return true when all clovers collected and at start position', () => {
        const grid = Array(3)
          .fill(null)
          .map(() =>
            Array(3)
              .fill(null)
              .map(() => ({ type: CellType.Empty }))
          );

        const world: World = {
          width: 3,
          height: 3,
          grid,
          character: {
            position: { x: 1, y: 1 },
            direction: Direction.North,
          },
        };

        const condition = goalConditions.collectCloversAndReturn(1, 1);
        expect(condition.check(world)).toBe(true);
      });

      it('should return false when at start but clovers remain', () => {
        const grid = Array(3)
          .fill(null)
          .map(() =>
            Array(3)
              .fill(null)
              .map(() => ({ type: CellType.Empty }))
          );
        grid[0][0] = { type: CellType.Clover };

        const world: World = {
          width: 3,
          height: 3,
          grid,
          character: {
            position: { x: 1, y: 1 },
            direction: Direction.North,
          },
        };

        const condition = goalConditions.collectCloversAndReturn(1, 1);
        expect(condition.check(world)).toBe(false);
      });

      it('should return false when all clovers collected but not at start', () => {
        const grid = Array(3)
          .fill(null)
          .map(() =>
            Array(3)
              .fill(null)
              .map(() => ({ type: CellType.Empty }))
          );

        const world: World = {
          width: 3,
          height: 3,
          grid,
          character: {
            position: { x: 2, y: 2 },
            direction: Direction.North,
          },
        };

        const condition = goalConditions.collectCloversAndReturn(1, 1);
        expect(condition.check(world)).toBe(false);
      });
    });

    describe('placeCloverAtPosition', () => {
      it('should return true when clover is at target position', () => {
        const grid = Array(3)
          .fill(null)
          .map(() =>
            Array(3)
              .fill(null)
              .map(() => ({ type: CellType.Empty }))
          );
        grid[1][2] = { type: CellType.Clover };

        const world: World = {
          width: 3,
          height: 3,
          grid,
          character: {
            position: { x: 0, y: 0 },
            direction: Direction.North,
          },
        };

        const condition = goalConditions.placeCloverAtPosition(2, 1);
        expect(condition.check(world)).toBe(true);
      });

      it('should return false when no clover at target position', () => {
        const grid = Array(3)
          .fill(null)
          .map(() =>
            Array(3)
              .fill(null)
              .map(() => ({ type: CellType.Empty }))
          );

        const world: World = {
          width: 3,
          height: 3,
          grid,
          character: {
            position: { x: 0, y: 0 },
            direction: Direction.North,
          },
        };

        const condition = goalConditions.placeCloverAtPosition(2, 1);
        expect(condition.check(world)).toBe(false);
      });
    });

    describe('noCloversOnGrid', () => {
      it('should return true when no clovers on grid', () => {
        const world: World = {
          width: 3,
          height: 3,
          grid: Array(3)
            .fill(null)
            .map(() => Array(3).fill({ type: CellType.Empty })),
          character: {
            position: { x: 1, y: 1 },
            direction: Direction.North,
          },
        };

        const condition = goalConditions.noCloversOnGrid();
        expect(condition.check(world)).toBe(true);
      });

      it('should return false when clovers remain on grid', () => {
        const grid = Array(3)
          .fill(null)
          .map(() =>
            Array(3)
              .fill(null)
              .map(() => ({ type: CellType.Empty }))
          );
        grid[1][1] = { type: CellType.Clover };

        const world: World = {
          width: 3,
          height: 3,
          grid,
          character: {
            position: { x: 0, y: 0 },
            direction: Direction.North,
          },
        };

        const condition = goalConditions.noCloversOnGrid();
        expect(condition.check(world)).toBe(false);
      });

      it('should have correct description', () => {
        const condition = goalConditions.noCloversOnGrid();
        expect(condition.description).toBe('Collect all clovers from the grid');
      });
    });

    describe('facingDirection', () => {
      it('should return true when facing target direction', () => {
        const world: World = {
          width: 3,
          height: 3,
          grid: Array(3)
            .fill(null)
            .map(() => Array(3).fill({ type: CellType.Empty })),
          character: {
            position: { x: 1, y: 1 },
            direction: Direction.South,
          },
        };

        const condition = goalConditions.facingDirection(Direction.South);
        expect(condition.check(world)).toBe(true);
      });

      it('should return false when not facing target direction', () => {
        const world: World = {
          width: 3,
          height: 3,
          grid: Array(3)
            .fill(null)
            .map(() => Array(3).fill({ type: CellType.Empty })),
          character: {
            position: { x: 1, y: 1 },
            direction: Direction.North,
          },
        };

        const condition = goalConditions.facingDirection(Direction.South);
        expect(condition.check(world)).toBe(false);
      });
    });

    describe('combined', () => {
      it('should return true when all conditions are met', () => {
        const world: World = {
          width: 3,
          height: 3,
          grid: Array(3)
            .fill(null)
            .map(() => Array(3).fill({ type: CellType.Empty })),
          character: {
            position: { x: 2, y: 2 },
            direction: Direction.East,
          },
        };

        const condition = goalConditions.combined(
          goalConditions.reachPosition(2, 2),
          goalConditions.facingDirection(Direction.East),
          goalConditions.noCloversOnGrid()
        );

        expect(condition.check(world)).toBe(true);
      });

      it('should return false when any condition is not met', () => {
        const world: World = {
          width: 3,
          height: 3,
          grid: Array(3)
            .fill(null)
            .map(() => Array(3).fill({ type: CellType.Empty })),
          character: {
            position: { x: 2, y: 2 },
            direction: Direction.North, // Wrong direction
          },
        };

        const condition = goalConditions.combined(
          goalConditions.reachPosition(2, 2),
          goalConditions.facingDirection(Direction.East),
          goalConditions.noCloversOnGrid()
        );

        expect(condition.check(world)).toBe(false);
      });

      it('should combine descriptions correctly', () => {
        const condition = goalConditions.combined(
          goalConditions.reachPosition(2, 2),
          goalConditions.noCloversOnGrid()
        );

        expect(condition.description).toBe(
          'Reach position (2, 2) AND Collect all clovers from the grid'
        );
      });
    });
  });

  describe('Progress tracking', () => {
    describe('saveProgress', () => {
      it('should save new progress to localStorage', () => {
        saveProgress('level-1', 8);

        const progress = getProgress();
        expect(progress).toHaveLength(1);
        expect(progress[0].scenarioId).toBe('level-1');
        expect(progress[0].completed).toBe(true);
        expect(progress[0].bestCommandCount).toBe(8);
      });

      it('should calculate stars based on command count', () => {
        saveProgress('level-1', 3);
        expect(getProgress()[0].stars).toBe(3);

        localStorageMock.clear();
        saveProgress('level-2', 8);
        expect(getProgress()[0].stars).toBe(2);

        localStorageMock.clear();
        saveProgress('level-3', 15);
        expect(getProgress()[0].stars).toBe(1);
      });

      it('should update existing progress with better score', () => {
        saveProgress('level-1', 15); // 1 star
        saveProgress('level-1', 5); // 3 stars

        const progress = getProgress();
        expect(progress).toHaveLength(1);
        expect(progress[0].stars).toBe(3);
        expect(progress[0].bestCommandCount).toBe(5);
      });

      it('should keep best score when completing with worse score', () => {
        saveProgress('level-1', 5); // 3 stars
        saveProgress('level-1', 15); // 1 star

        const progress = getProgress();
        expect(progress[0].stars).toBe(3);
        expect(progress[0].bestCommandCount).toBe(5);
      });

      it('should track multiple scenarios', () => {
        saveProgress('level-1', 5);
        saveProgress('level-2', 8);
        saveProgress('level-3', 12);

        const progress = getProgress();
        expect(progress).toHaveLength(3);
      });
    });

    describe('getScenarioProgress', () => {
      it('should return progress for specific scenario', () => {
        saveProgress('level-1', 5);
        saveProgress('level-2', 8);

        const progress = getScenarioProgress('level-1');
        expect(progress).toBeDefined();
        expect(progress?.scenarioId).toBe('level-1');
        expect(progress?.bestCommandCount).toBe(5);
      });

      it('should return undefined for non-existent scenario', () => {
        saveProgress('level-1', 5);

        const progress = getScenarioProgress('level-99');
        expect(progress).toBeUndefined();
      });
    });

    describe('getProgress', () => {
      it('should return empty array when no progress saved', () => {
        const progress = getProgress();
        expect(progress).toEqual([]);
      });

      it('should return all saved progress', () => {
        saveProgress('level-1', 5);
        saveProgress('level-2', 8);

        const progress = getProgress();
        expect(progress).toHaveLength(2);
      });
    });
  });
});
