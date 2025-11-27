// Pure functions for world simulation logic

import { World, Direction, Position, Cell, CellType, Character } from './types';

/**
 * Creates a new empty world with the character in the center
 */
export function createWorld(width: number, height: number): World {
  const grid: Cell[][] = Array(height)
    .fill(null)
    .map(() =>
      Array(width)
        .fill(null)
        .map(() => ({ type: CellType.Empty }))
    );

  // Add some walls for visual interest
  if (width > 3 && height > 3) {
    grid[1][1] = { type: CellType.Wall };
    grid[1][width - 2] = { type: CellType.Wall };
    grid[height - 2][1] = { type: CellType.Wall };
    grid[height - 2][width - 2] = { type: CellType.Wall };
  }

  return {
    width,
    height,
    grid,
    character: {
      position: {
        x: Math.floor(width / 2),
        y: Math.floor(height / 2),
      },
      direction: Direction.North,
    },
  };
}

/**
 * Gets the position in front of the character based on their direction
 */
function getForwardPosition(position: Position, direction: Direction): Position {
  switch (direction) {
    case Direction.North:
      return { x: position.x, y: position.y - 1 };
    case Direction.East:
      return { x: position.x + 1, y: position.y };
    case Direction.South:
      return { x: position.x, y: position.y + 1 };
    case Direction.West:
      return { x: position.x - 1, y: position.y };
  }
}

/**
 * Checks if a position is valid (within bounds and not a wall)
 */
function isValidPosition(world: World, position: Position): boolean {
  if (
    position.x < 0 ||
    position.x >= world.width ||
    position.y < 0 ||
    position.y >= world.height
  ) {
    return false;
  }

  return world.grid[position.y][position.x].type !== CellType.Wall;
}

/**
 * Moves the character forward one step if possible
 * Returns a new World with updated character position
 */
export function moveForward(world: World): World {
  const newPosition = getForwardPosition(
    world.character.position,
    world.character.direction
  );

  if (!isValidPosition(world, newPosition)) {
    return world; // Can't move, return unchanged world
  }

  return {
    ...world,
    character: {
      ...world.character,
      position: newPosition,
    },
  };
}

/**
 * Turns the character left (counterclockwise)
 */
export function turnLeft(world: World): World {
  const directionMap: Record<Direction, Direction> = {
    [Direction.North]: Direction.West,
    [Direction.West]: Direction.South,
    [Direction.South]: Direction.East,
    [Direction.East]: Direction.North,
  };

  return {
    ...world,
    character: {
      ...world.character,
      direction: directionMap[world.character.direction],
    },
  };
}

/**
 * Turns the character right (clockwise)
 */
export function turnRight(world: World): World {
  const directionMap: Record<Direction, Direction> = {
    [Direction.North]: Direction.East,
    [Direction.East]: Direction.South,
    [Direction.South]: Direction.West,
    [Direction.West]: Direction.North,
  };

  return {
    ...world,
    character: {
      ...world.character,
      direction: directionMap[world.character.direction],
    },
  };
}

/**
 * Resets the world to initial state
 */
export function resetWorld(world: World): World {
  return createWorld(world.width, world.height);
}
