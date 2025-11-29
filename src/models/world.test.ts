import { describe, it, expect } from 'vitest';
import { createWorld, moveForward, turnLeft, turnRight, pickClover, placeClover } from './world';
import { World, Direction, CellType } from './types';

describe('World Model', () => {
  describe('createWorld', () => {
    it('should create a world with correct dimensions', () => {
      const world = createWorld(10, 8);
      expect(world.width).toBe(10);
      expect(world.height).toBe(8);
      expect(world.grid).toHaveLength(8);
      expect(world.grid[0]).toHaveLength(10);
    });

    it('should place character in the center', () => {
      const world = createWorld(10, 8);
      expect(world.character.position.x).toBe(5);
      expect(world.character.position.y).toBe(4);
    });

    it('should initialize character facing north with empty inventory', () => {
      const world = createWorld(10, 8);
      expect(world.character.direction).toBe(Direction.North);
      expect(world.character.inventory).toBe(0);
    });

    it('should populate world with objects for larger grids', () => {
      const world = createWorld(10, 8);
      let hasClover = false;
      let hasTree = false;
      let hasMushroom = false;

      world.grid.forEach((row) => {
        row.forEach((cell) => {
          if (cell.type === CellType.Clover) hasClover = true;
          if (cell.type === CellType.Tree) hasTree = true;
          if (cell.type === CellType.Mushroom) hasMushroom = true;
        });
      });

      expect(hasClover).toBe(true);
      expect(hasTree).toBe(true);
      expect(hasMushroom).toBe(true);
    });
  });

  describe('moveForward', () => {
    it('should move character north when facing north', () => {
      const world: World = {
        width: 5,
        height: 5,
        grid: Array(5)
          .fill(null)
          .map(() => Array(5).fill({ type: CellType.Empty })),
        character: {
          position: { x: 2, y: 2 },
          direction: Direction.North,
          inventory: 0,
        },
      };

      const newWorld = moveForward(world);
      expect(newWorld.character.position).toEqual({ x: 2, y: 1 });
    });

    it('should move character east when facing east', () => {
      const world: World = {
        width: 5,
        height: 5,
        grid: Array(5)
          .fill(null)
          .map(() => Array(5).fill({ type: CellType.Empty })),
        character: {
          position: { x: 2, y: 2 },
          direction: Direction.East,
          inventory: 0,
        },
      };

      const newWorld = moveForward(world);
      expect(newWorld.character.position).toEqual({ x: 3, y: 2 });
    });

    it('should not move when blocked by boundary', () => {
      const world: World = {
        width: 5,
        height: 5,
        grid: Array(5)
          .fill(null)
          .map(() => Array(5).fill({ type: CellType.Empty })),
        character: {
          position: { x: 2, y: 0 },
          direction: Direction.North,
          inventory: 0,
        },
      };

      const newWorld = moveForward(world);
      expect(newWorld.character.position).toEqual({ x: 2, y: 0 });
    });

    it('should not move when blocked by tree', () => {
      const grid = Array(5)
        .fill(null)
        .map(() =>
          Array(5)
            .fill(null)
            .map(() => ({ type: CellType.Empty }))
        );
      grid[1][2] = { type: CellType.Tree };

      const world: World = {
        width: 5,
        height: 5,
        grid,
        character: {
          position: { x: 2, y: 2 },
          direction: Direction.North,
          inventory: 0,
        },
      };

      const newWorld = moveForward(world);
      expect(newWorld.character.position).toEqual({ x: 2, y: 2 });
    });

    it('should move onto clover cell', () => {
      const grid = Array(5)
        .fill(null)
        .map(() =>
          Array(5)
            .fill(null)
            .map(() => ({ type: CellType.Empty }))
        );
      grid[1][2] = { type: CellType.Clover };

      const world: World = {
        width: 5,
        height: 5,
        grid,
        character: {
          position: { x: 2, y: 2 },
          direction: Direction.North,
          inventory: 0,
        },
      };

      const newWorld = moveForward(world);
      expect(newWorld.character.position).toEqual({ x: 2, y: 1 });
      expect(newWorld.grid[1][2].type).toBe(CellType.Clover);
    });

    it('should push mushroom when space is available', () => {
      const grid = Array(5)
        .fill(null)
        .map(() =>
          Array(5)
            .fill(null)
            .map(() => ({ type: CellType.Empty }))
        );
      grid[1][2] = { type: CellType.Mushroom };

      const world: World = {
        width: 5,
        height: 5,
        grid,
        character: {
          position: { x: 2, y: 2 },
          direction: Direction.North,
          inventory: 0,
        },
      };

      const newWorld = moveForward(world);
      expect(newWorld.character.position).toEqual({ x: 2, y: 1 });
      expect(newWorld.grid[1][2].type).toBe(CellType.Empty);
      expect(newWorld.grid[0][2].type).toBe(CellType.Mushroom);
    });

    it('should not push mushroom when blocked by tree', () => {
      const grid = Array(5)
        .fill(null)
        .map(() =>
          Array(5)
            .fill(null)
            .map(() => ({ type: CellType.Empty }))
        );
      grid[1][2] = { type: CellType.Mushroom };
      grid[0][2] = { type: CellType.Tree };

      const world: World = {
        width: 5,
        height: 5,
        grid,
        character: {
          position: { x: 2, y: 2 },
          direction: Direction.North,
          inventory: 0,
        },
      };

      const newWorld = moveForward(world);
      expect(newWorld.character.position).toEqual({ x: 2, y: 2 });
      expect(newWorld.grid[1][2].type).toBe(CellType.Mushroom);
    });

    it('should not push mushroom out of bounds', () => {
      const grid = Array(5)
        .fill(null)
        .map(() =>
          Array(5)
            .fill(null)
            .map(() => ({ type: CellType.Empty }))
        );
      grid[0][2] = { type: CellType.Mushroom };

      const world: World = {
        width: 5,
        height: 5,
        grid,
        character: {
          position: { x: 2, y: 1 },
          direction: Direction.North,
          inventory: 0,
        },
      };

      const newWorld = moveForward(world);
      expect(newWorld.character.position).toEqual({ x: 2, y: 1 });
      expect(newWorld.grid[0][2].type).toBe(CellType.Mushroom);
    });
  });

  describe('turnLeft', () => {
    it('should turn from North to West', () => {
      const world: World = {
        width: 5,
        height: 5,
        grid: Array(5)
          .fill(null)
          .map(() => Array(5).fill({ type: CellType.Empty })),
        character: {
          position: { x: 2, y: 2 },
          direction: Direction.North,
          inventory: 0,
        },
      };

      const newWorld = turnLeft(world);
      expect(newWorld.character.direction).toBe(Direction.West);
    });

    it('should turn from West to South', () => {
      const world: World = {
        width: 5,
        height: 5,
        grid: Array(5)
          .fill(null)
          .map(() => Array(5).fill({ type: CellType.Empty })),
        character: {
          position: { x: 2, y: 2 },
          direction: Direction.West,
          inventory: 0,
        },
      };

      const newWorld = turnLeft(world);
      expect(newWorld.character.direction).toBe(Direction.South);
    });

    it('should complete full rotation back to North', () => {
      let world: World = {
        width: 5,
        height: 5,
        grid: Array(5)
          .fill(null)
          .map(() => Array(5).fill({ type: CellType.Empty })),
        character: {
          position: { x: 2, y: 2 },
          direction: Direction.North,
          inventory: 0,
        },
      };

      world = turnLeft(world);
      world = turnLeft(world);
      world = turnLeft(world);
      world = turnLeft(world);
      expect(world.character.direction).toBe(Direction.North);
    });
  });

  describe('turnRight', () => {
    it('should turn from North to East', () => {
      const world: World = {
        width: 5,
        height: 5,
        grid: Array(5)
          .fill(null)
          .map(() => Array(5).fill({ type: CellType.Empty })),
        character: {
          position: { x: 2, y: 2 },
          direction: Direction.North,
          inventory: 0,
        },
      };

      const newWorld = turnRight(world);
      expect(newWorld.character.direction).toBe(Direction.East);
    });

    it('should turn from East to South', () => {
      const world: World = {
        width: 5,
        height: 5,
        grid: Array(5)
          .fill(null)
          .map(() => Array(5).fill({ type: CellType.Empty })),
        character: {
          position: { x: 2, y: 2 },
          direction: Direction.East,
          inventory: 0,
        },
      };

      const newWorld = turnRight(world);
      expect(newWorld.character.direction).toBe(Direction.South);
    });

    it('should complete full rotation back to North', () => {
      let world: World = {
        width: 5,
        height: 5,
        grid: Array(5)
          .fill(null)
          .map(() => Array(5).fill({ type: CellType.Empty })),
        character: {
          position: { x: 2, y: 2 },
          direction: Direction.North,
          inventory: 0,
        },
      };

      world = turnRight(world);
      world = turnRight(world);
      world = turnRight(world);
      world = turnRight(world);
      expect(world.character.direction).toBe(Direction.North);
    });
  });

  describe('pickClover', () => {
    it('should pick up clover and increase inventory', () => {
      const grid = Array(5)
        .fill(null)
        .map(() =>
          Array(5)
            .fill(null)
            .map(() => ({ type: CellType.Empty }))
        );
      grid[2][2] = { type: CellType.Clover };

      const world: World = {
        width: 5,
        height: 5,
        grid,
        character: {
          position: { x: 2, y: 2 },
          direction: Direction.North,
          inventory: 0,
        },
      };

      const newWorld = pickClover(world);
      expect(newWorld.character.inventory).toBe(1);
      expect(newWorld.grid[2][2].type).toBe(CellType.Empty);
    });

    it('should not pick up when no clover present', () => {
      const world: World = {
        width: 5,
        height: 5,
        grid: Array(5)
          .fill(null)
          .map(() =>
            Array(5)
              .fill(null)
              .map(() => ({ type: CellType.Empty }))
          ),
        character: {
          position: { x: 2, y: 2 },
          direction: Direction.North,
          inventory: 0,
        },
      };

      const newWorld = pickClover(world);
      expect(newWorld.character.inventory).toBe(0);
      expect(newWorld).toEqual(world);
    });

    it('should accumulate multiple clovers in inventory', () => {
      const grid = Array(5)
        .fill(null)
        .map(() =>
          Array(5)
            .fill(null)
            .map(() => ({ type: CellType.Empty }))
        );
      grid[2][2] = { type: CellType.Clover };

      let world: World = {
        width: 5,
        height: 5,
        grid,
        character: {
          position: { x: 2, y: 2 },
          direction: Direction.North,
          inventory: 3,
        },
      };

      world = pickClover(world);
      expect(world.character.inventory).toBe(4);
    });
  });

  describe('placeClover', () => {
    it('should place clover and decrease inventory', () => {
      const world: World = {
        width: 5,
        height: 5,
        grid: Array(5)
          .fill(null)
          .map(() =>
            Array(5)
              .fill(null)
              .map(() => ({ type: CellType.Empty }))
          ),
        character: {
          position: { x: 2, y: 2 },
          direction: Direction.North,
          inventory: 1,
        },
      };

      const newWorld = placeClover(world);
      expect(newWorld.character.inventory).toBe(0);
      expect(newWorld.grid[2][2].type).toBe(CellType.Clover);
    });

    it('should not place when inventory is empty', () => {
      const world: World = {
        width: 5,
        height: 5,
        grid: Array(5)
          .fill(null)
          .map(() =>
            Array(5)
              .fill(null)
              .map(() => ({ type: CellType.Empty }))
          ),
        character: {
          position: { x: 2, y: 2 },
          direction: Direction.North,
          inventory: 0,
        },
      };

      const newWorld = placeClover(world);
      expect(newWorld).toEqual(world);
      expect(newWorld.grid[2][2].type).toBe(CellType.Empty);
    });

    it('should not place when cell is not empty', () => {
      const grid = Array(5)
        .fill(null)
        .map(() =>
          Array(5)
            .fill(null)
            .map(() => ({ type: CellType.Empty }))
        );
      grid[2][2] = { type: CellType.Tree };

      const world: World = {
        width: 5,
        height: 5,
        grid,
        character: {
          position: { x: 2, y: 2 },
          direction: Direction.North,
          inventory: 1,
        },
      };

      const newWorld = placeClover(world);
      expect(newWorld).toEqual(world);
      expect(newWorld.character.inventory).toBe(1);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle sequence of moves, turns, and clover operations', () => {
      const grid = Array(5)
        .fill(null)
        .map(() =>
          Array(5)
            .fill(null)
            .map(() => ({ type: CellType.Empty }))
        );
      grid[1][2] = { type: CellType.Clover };

      let world: World = {
        width: 5,
        height: 5,
        grid,
        character: {
          position: { x: 2, y: 2 },
          direction: Direction.North,
          inventory: 0,
        },
      };

      // Move north onto clover
      world = moveForward(world);
      expect(world.character.position).toEqual({ x: 2, y: 1 });

      // Pick up the clover
      world = pickClover(world);
      expect(world.character.inventory).toBe(1);
      expect(world.grid[1][2].type).toBe(CellType.Empty);

      // Turn right (now facing East)
      world = turnRight(world);
      expect(world.character.direction).toBe(Direction.East);

      // Move east
      world = moveForward(world);
      expect(world.character.position).toEqual({ x: 3, y: 1 });

      // Place clover
      world = placeClover(world);
      expect(world.character.inventory).toBe(0);
      expect(world.grid[1][3].type).toBe(CellType.Clover);
    });
  });
});
