// Pure functions for world simulation logic

import { World, Direction, Position, Cell, CellType } from './types';

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
      direction: Direction.East,
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
 * Gets the position to the left of the character based on their direction
 */
function getLeftPosition(position: Position, direction: Direction): Position {
  switch (direction) {
    case Direction.North:
      return { x: position.x - 1, y: position.y };
    case Direction.East:
      return { x: position.x, y: position.y - 1 };
    case Direction.South:
      return { x: position.x + 1, y: position.y };
    case Direction.West:
      return { x: position.x, y: position.y + 1 };
  }
}

/**
 * Gets the position to the right of the character based on their direction
 */
function getRightPosition(position: Position, direction: Direction): Position {
  switch (direction) {
    case Direction.North:
      return { x: position.x + 1, y: position.y };
    case Direction.East:
      return { x: position.x, y: position.y + 1 };
    case Direction.South:
      return { x: position.x - 1, y: position.y };
    case Direction.West:
      return { x: position.x, y: position.y - 1 };
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
 * Wraps a position around the world edges (Pac-Man style)
 */
function wrapPosition(world: World, position: Position): Position {
  return {
    x: ((position.x % world.width) + world.width) % world.width,
    y: ((position.y % world.height) + world.height) % world.height,
  };
}

/**
 * Checks if a position is valid (within bounds and not blocked)
 */
function _isValidPosition(world: World, position: Position): boolean {
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
function _canPushMushroom(world: World, mushroomPos: Position, direction: Direction): boolean {
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
 * Wraps around world edges (Pac-Man style)
 */
export function moveForward(world: World): World {
  const rawPosition = getForwardPosition(world.character.position, world.character.direction);

  // Wrap position around world edges if out of bounds
  const newPosition = wrapPosition(world, rawPosition);

  const targetCellType = world.grid[newPosition.y][newPosition.x].type;

  // Check if there's a mushroom to push
  if (targetCellType === CellType.Mushroom) {
    // Try to push the mushroom
    const rawMushroomPos = getForwardPosition(newPosition, world.character.direction);
    const mushroomNewPos = wrapPosition(world, rawMushroomPos);

    const mushroomTargetCellType = world.grid[mushroomNewPos.y][mushroomNewPos.x].type;

    // Mushroom can only be pushed to empty cells
    if (mushroomTargetCellType !== CellType.Empty) {
      return world; // Can't push mushroom (blocked)
    }

    // Push the mushroom
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
  // Can move onto empty cells and clovers, but NOT trees
  if (targetCellType !== CellType.Empty && targetCellType !== CellType.Clover) {
    return world; // Can't move, blocked by tree
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
  };
}

/**
 * Places a clover at the character's current position
 */
export function placeClover(world: World): World {
  const { x, y } = world.character.position;
  const cell = world.grid[y][x];

  if (cell.type !== CellType.Empty) {
    return world; // Can't place here - cell not empty
  }

  const newGrid = world.grid.map((row) => [...row]);
  newGrid[y][x] = { type: CellType.Clover };

  return {
    ...world,
    grid: newGrid,
  };
}

// ========== Sensor Functions ==========

/**
 * Checks if there is a tree in front of Kara
 * With wrap-around, positions always wrap to the other side
 */
export function treeFront(world: World): boolean {
  const rawPos = getForwardPosition(world.character.position, world.character.direction);
  const frontPos = wrapPosition(world, rawPos);

  return world.grid[frontPos.y][frontPos.x].type === CellType.Tree;
}

/**
 * Checks if there is a tree to the left of Kara
 * With wrap-around, positions always wrap to the other side
 */
export function treeLeft(world: World): boolean {
  const rawPos = getLeftPosition(world.character.position, world.character.direction);
  const leftPos = wrapPosition(world, rawPos);

  return world.grid[leftPos.y][leftPos.x].type === CellType.Tree;
}

/**
 * Checks if there is a tree to the right of Kara
 * With wrap-around, positions always wrap to the other side
 */
export function treeRight(world: World): boolean {
  const rawPos = getRightPosition(world.character.position, world.character.direction);
  const rightPos = wrapPosition(world, rawPos);

  return world.grid[rightPos.y][rightPos.x].type === CellType.Tree;
}

/**
 * Checks if there is a mushroom in front of Kara
 * With wrap-around, positions always wrap to the other side
 */
export function mushroomFront(world: World): boolean {
  const rawPos = getForwardPosition(world.character.position, world.character.direction);
  const frontPos = wrapPosition(world, rawPos);

  return world.grid[frontPos.y][frontPos.x].type === CellType.Mushroom;
}

/**
 * Checks if Kara is standing on a clover leaf
 */
export function onLeaf(world: World): boolean {
  const { x, y } = world.character.position;
  return world.grid[y][x].type === CellType.Clover;
}
