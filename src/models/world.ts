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

  // Add some objects for visual interest
  if (width > 5 && height > 5) {
    grid[2][3] = { type: CellType.Clover };
    grid[2][4] = { type: CellType.Clover };
    grid[3][2] = { type: CellType.Clover };
    grid[3][5] = { type: CellType.Clover };
    grid[4][3] = { type: CellType.Clover };
    grid[4][4] = { type: CellType.Clover };
    grid[5][2] = { type: CellType.Clover };
    grid[1][1] = { type: CellType.Tree };
    grid[1][width - 2] = { type: CellType.Tree };
    grid[height - 2][1] = { type: CellType.Mushroom };
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
      inventory: 0,
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
 * Checks if a position is within bounds
 */
function isInBounds(world: World, position: Position): boolean {
  return (
    position.x >= 0 && position.x < world.width && position.y >= 0 && position.y < world.height
  );
}

/**
 * Checks if a position is valid (within bounds and not blocked)
 */
function isValidPosition(world: World, position: Position): boolean {
  if (!isInBounds(world, position)) {
    return false;
  }

  const cellType = world.grid[position.y][position.x].type;
  // Can move onto empty cells and clovers, but NOT walls or trees
  // Mushrooms are handled separately (can be pushed)
  return cellType === CellType.Empty || cellType === CellType.Clover;
}

/**
 * Checks if a mushroom can be pushed in a given direction
 */
function canPushMushroom(world: World, mushroomPos: Position, direction: Direction): boolean {
  const pushToPos = getForwardPosition(mushroomPos, direction);

  if (!isInBounds(world, pushToPos)) {
    return false; // Can't push mushroom out of bounds
  }

  const targetCellType = world.grid[pushToPos.y][pushToPos.x].type;
  // Mushroom can only be pushed to empty cells
  return targetCellType === CellType.Empty;
}

/**
 * Moves the character forward one step if possible
 * Returns a new World with updated character position
 * Handles pushing mushrooms if necessary
 */
export function moveForward(world: World): World {
  const newPosition = getForwardPosition(world.character.position, world.character.direction);

  if (!isInBounds(world, newPosition)) {
    return world; // Can't move out of bounds
  }

  const targetCellType = world.grid[newPosition.y][newPosition.x].type;

  // Check if there's a mushroom to push
  if (targetCellType === CellType.Mushroom) {
    // Try to push the mushroom
    if (!canPushMushroom(world, newPosition, world.character.direction)) {
      return world; // Can't push mushroom (blocked or edge)
    }

    // Push the mushroom
    const mushroomNewPos = getForwardPosition(newPosition, world.character.direction);
    const newGrid = world.grid.map((row) => [...row]);

    // Move mushroom to new position
    newGrid[mushroomNewPos.y][mushroomNewPos.x] = { type: CellType.Mushroom };
    // Clear old mushroom position
    newGrid[newPosition.y][newPosition.x] = { type: CellType.Empty };

    // Move character into mushroom's old position
    return {
      ...world,
      grid: newGrid,
      character: {
        ...world.character,
        position: newPosition,
      },
    };
  }

  // Normal movement (no mushroom)
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

/**
 * Picks up a clover at the character's current position
 */
export function pickClover(world: World): World {
  const { x, y } = world.character.position;
  const cell = world.grid[y][x];

  if (cell.type !== CellType.Clover) {
    return world; // No clover to pick
  }

  const newGrid = world.grid.map((row) => [...row]);
  newGrid[y][x] = { type: CellType.Empty };

  return {
    ...world,
    grid: newGrid,
    character: {
      ...world.character,
      inventory: world.character.inventory + 1,
    },
  };
}

/**
 * Places a clover at the character's current position
 */
export function placeClover(world: World): World {
  const { x, y } = world.character.position;
  const cell = world.grid[y][x];

  if (cell.type !== CellType.Empty || world.character.inventory === 0) {
    return world; // Can't place here or no clovers in inventory
  }

  const newGrid = world.grid.map((row) => [...row]);
  newGrid[y][x] = { type: CellType.Clover };

  return {
    ...world,
    grid: newGrid,
    character: {
      ...world.character,
      inventory: world.character.inventory - 1,
    },
  };
}
