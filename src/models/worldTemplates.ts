// World templates and import/export utilities

import { World, CellType, Direction } from './types';

/**
 * Creates an empty world template
 */
export function createEmptyTemplate(width: number = 8, height: number = 6): World {
  const grid = Array(height)
    .fill(null)
    .map(() =>
      Array(width)
        .fill(null)
        .map(() => ({ type: CellType.Empty }))
    );

  return {
    width,
    height,
    grid,
    character: {
      position: { x: Math.floor(width / 2), y: Math.floor(height / 2) },
      direction: Direction.North,
      inventory: 0,
    },
  };
}

/**
 * Creates a maze template with trees
 */
export function createMazeTemplate(): World {
  const width = 9;
  const height = 7;
  const grid = Array(height)
    .fill(null)
    .map(() =>
      Array(width)
        .fill(null)
        .map(() => ({ type: CellType.Empty }))
    );

  // Create maze with trees
  // Top and bottom borders
  for (let x = 0; x < width; x++) {
    grid[0][x] = { type: CellType.Tree };
    grid[height - 1][x] = { type: CellType.Tree };
  }
  // Left and right borders
  for (let y = 0; y < height; y++) {
    grid[y][0] = { type: CellType.Tree };
    grid[y][width - 1] = { type: CellType.Tree };
  }
  // Internal trees
  grid[2][2] = { type: CellType.Tree };
  grid[2][3] = { type: CellType.Tree };
  grid[2][5] = { type: CellType.Tree };
  grid[2][6] = { type: CellType.Tree };
  grid[4][2] = { type: CellType.Tree };
  grid[4][3] = { type: CellType.Tree };
  grid[4][5] = { type: CellType.Tree };
  grid[4][6] = { type: CellType.Tree };

  // Add goal clover
  grid[1][width - 2] = { type: CellType.Clover };

  return {
    width,
    height,
    grid,
    character: {
      position: { x: 1, y: 1 },
      direction: Direction.East,
      inventory: 0,
    },
  };
}

/**
 * Creates a garden template filled with clovers
 */
export function createGardenTemplate(): World {
  const width = 8;
  const height = 6;
  const grid = Array(height)
    .fill(null)
    .map(() =>
      Array(width)
        .fill(null)
        .map(() => ({ type: CellType.Empty }))
    );

  // Create a pattern of clovers
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if ((x + y) % 2 === 0) {
        grid[y][x] = { type: CellType.Clover };
      }
    }
  }

  // Add some trees as decoration
  grid[1][1] = { type: CellType.Tree };
  grid[1][width - 2] = { type: CellType.Tree };
  grid[height - 2][1] = { type: CellType.Tree };
  grid[height - 2][width - 2] = { type: CellType.Tree };

  return {
    width,
    height,
    grid,
    character: {
      position: { x: Math.floor(width / 2), y: Math.floor(height / 2) },
      direction: Direction.North,
      inventory: 0,
    },
  };
}

/**
 * Creates an obstacle course template
 */
export function createObstacleCourseTemplate(): World {
  const width = 10;
  const height = 7;
  const grid = Array(height)
    .fill(null)
    .map(() =>
      Array(width)
        .fill(null)
        .map(() => ({ type: CellType.Empty }))
    );

  // Create obstacle pattern
  // Trees
  grid[1][2] = { type: CellType.Tree };
  grid[1][5] = { type: CellType.Tree };
  grid[1][8] = { type: CellType.Tree };
  grid[3][3] = { type: CellType.Tree };
  grid[3][6] = { type: CellType.Tree };
  grid[5][2] = { type: CellType.Tree };
  grid[5][5] = { type: CellType.Tree };
  grid[5][8] = { type: CellType.Tree };

  // Mushrooms
  grid[2][1] = { type: CellType.Mushroom };
  grid[2][7] = { type: CellType.Mushroom };
  grid[4][4] = { type: CellType.Mushroom };

  // Clovers to collect
  grid[1][1] = { type: CellType.Clover };
  grid[1][width - 2] = { type: CellType.Clover };
  grid[height - 2][1] = { type: CellType.Clover };
  grid[height - 2][width - 2] = { type: CellType.Clover };

  return {
    width,
    height,
    grid,
    character: {
      position: { x: 0, y: 0 },
      direction: Direction.East,
      inventory: 0,
    },
  };
}

/**
 * Gets a template by name
 */
export function getTemplateByName(name: string): World {
  switch (name) {
    case 'Empty Grid':
      return createEmptyTemplate();
    case 'Maze':
      return createMazeTemplate();
    case 'Garden':
      return createGardenTemplate();
    case 'Obstacle Course':
      return createObstacleCourseTemplate();
    default:
      return createEmptyTemplate();
  }
}

/**
 * Exports a world as JSON string
 */
export function exportWorld(world: World): string {
  return JSON.stringify(world, null, 2);
}

/**
 * Downloads a world as a JSON file
 */
export function downloadWorld(world: World, filename: string = 'kara-world.json') {
  const json = exportWorld(world);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports a program as JSON string
 */
export function exportProgram(program: any[]): string {
  return JSON.stringify(program, null, 2);
}

/**
 * Downloads a program as a JSON file
 */
export function downloadProgram(program: any[], filename: string = 'kara-program.json') {
  const json = exportProgram(program);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates that an imported world is valid
 */
export function isValidWorld(data: any): data is World {
  return (
    data &&
    typeof data.width === 'number' &&
    typeof data.height === 'number' &&
    Array.isArray(data.grid) &&
    data.grid.length === data.height &&
    data.grid.every((row: any) => Array.isArray(row) && row.length === data.width) &&
    data.character &&
    typeof data.character.position === 'object' &&
    typeof data.character.position.x === 'number' &&
    typeof data.character.position.y === 'number' &&
    typeof data.character.direction === 'string' &&
    typeof data.character.inventory === 'number'
  );
}
