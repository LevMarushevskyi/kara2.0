// World templates and import/export utilities

import { World, CellType, Direction } from './types';
import { Command } from './program';

// ========== .world File Format Support (KaraX Compatibility) ==========

/**
 * Direction mapping between KaraX .world format and our internal format
 * KaraX: 0=North/Up, 1=East/Right, 2=South/Down, 3=West/Left
 */
const KARAX_DIRECTION_TO_INTERNAL: Record<number, Direction> = {
  0: Direction.North,
  1: Direction.East,
  2: Direction.South,
  3: Direction.West,
};

const INTERNAL_DIRECTION_TO_KARAX: Record<Direction, number> = {
  [Direction.North]: 0,
  [Direction.East]: 1,
  [Direction.South]: 2,
  [Direction.West]: 3,
};

/**
 * Parses a .world XML file content and returns a World object
 */
export function parseWorldFile(xmlContent: string): World {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');

  // Check for parsing errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML format in .world file');
  }

  const xmlWorld = doc.querySelector('XmlWorld');
  if (!xmlWorld) {
    throw new Error('Missing XmlWorld element in .world file');
  }

  // Get world dimensions
  const sizex = parseInt(xmlWorld.getAttribute('sizex') || '8', 10);
  const sizey = parseInt(xmlWorld.getAttribute('sizey') || '6', 10);

  // Create empty grid
  const grid = Array(sizey)
    .fill(null)
    .map(() =>
      Array(sizex)
        .fill(null)
        .map(() => ({ type: CellType.Empty }))
    );

  // Parse walls/trees (XmlWallPoints)
  const wallPoints = doc.querySelectorAll('XmlWallPoints XmlPoint');
  wallPoints.forEach((point) => {
    const x = parseInt(point.getAttribute('x') || '0', 10);
    const y = parseInt(point.getAttribute('y') || '0', 10);
    if (x >= 0 && x < sizex && y >= 0 && y < sizey) {
      grid[y][x] = { type: CellType.Tree };
    }
  });

  // Parse obstacles/mushrooms (XmlObstaclePoints)
  const obstaclePoints = doc.querySelectorAll('XmlObstaclePoints XmlPoint');
  obstaclePoints.forEach((point) => {
    const x = parseInt(point.getAttribute('x') || '0', 10);
    const y = parseInt(point.getAttribute('y') || '0', 10);
    if (x >= 0 && x < sizex && y >= 0 && y < sizey) {
      grid[y][x] = { type: CellType.Mushroom };
    }
  });

  // Parse clovers (XmlPaintedfieldPoints)
  const cloverPoints = doc.querySelectorAll('XmlPaintedfieldPoints XmlPoint');
  cloverPoints.forEach((point) => {
    const x = parseInt(point.getAttribute('x') || '0', 10);
    const y = parseInt(point.getAttribute('y') || '0', 10);
    // type="0" is a clover/leaf
    if (x >= 0 && x < sizex && y >= 0 && y < sizey) {
      grid[y][x] = { type: CellType.Clover };
    }
  });

  // Parse Kara position (XmlKaraList)
  const karaElement = doc.querySelector('XmlKaraList XmlKara');
  let characterX = Math.floor(sizex / 2);
  let characterY = Math.floor(sizey / 2);
  let characterDirection = Direction.North;

  if (karaElement) {
    characterX = parseInt(karaElement.getAttribute('x') || String(characterX), 10);
    characterY = parseInt(karaElement.getAttribute('y') || String(characterY), 10);
    const directionNum = parseInt(karaElement.getAttribute('direction') || '0', 10);
    characterDirection = KARAX_DIRECTION_TO_INTERNAL[directionNum] || Direction.North;
  }

  return {
    width: sizex,
    height: sizey,
    grid,
    character: {
      position: { x: characterX, y: characterY },
      direction: characterDirection,
      inventory: 0,
    },
  };
}

/**
 * Exports a World object to .world XML format (KaraX compatible)
 */
export function exportWorldToXml(world: World): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
  lines.push(`<XmlWorld sizex="${world.width}" sizey="${world.height}" version="KaraX 1.0 kara">`);

  // Collect all trees/walls
  const wallPoints: { x: number; y: number }[] = [];
  const obstaclePoints: { x: number; y: number }[] = [];
  const cloverPoints: { x: number; y: number }[] = [];

  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      const cell = world.grid[y][x];
      if (cell.type === CellType.Tree) {
        wallPoints.push({ x, y });
      } else if (cell.type === CellType.Mushroom) {
        obstaclePoints.push({ x, y });
      } else if (cell.type === CellType.Clover) {
        cloverPoints.push({ x, y });
      }
    }
  }

  // Write XmlWallPoints
  lines.push('    <XmlWallPoints>');
  wallPoints.forEach((p) => {
    lines.push(`        <XmlPoint x="${p.x}" y="${p.y}"/>`);
  });
  lines.push('    </XmlWallPoints>');

  // Write XmlObstaclePoints
  lines.push('    <XmlObstaclePoints>');
  obstaclePoints.forEach((p) => {
    lines.push(`        <XmlPoint x="${p.x}" y="${p.y}"/>`);
  });
  lines.push('    </XmlObstaclePoints>');

  // Write XmlPaintedfieldPoints (clovers)
  lines.push('    <XmlPaintedfieldPoints>');
  cloverPoints.forEach((p) => {
    lines.push(`        <XmlPoint type="0" x="${p.x}" y="${p.y}"/>`);
  });
  lines.push('    </XmlPaintedfieldPoints>');

  // Write XmlKaraList
  const karaDirection = INTERNAL_DIRECTION_TO_KARAX[world.character.direction];
  lines.push('    <XmlKaraList>');
  lines.push(
    `        <XmlKara direction="${karaDirection}" name="Kara" x="${world.character.position.x}" y="${world.character.position.y}"/>`
  );
  lines.push('    </XmlKaraList>');

  // Write empty XmlStreetList (for compatibility)
  lines.push('    <XmlStreetList/>');

  lines.push('</XmlWorld>');

  return lines.join('\n');
}

/**
 * Downloads a world as a .world file (KaraX compatible XML format)
 */
export function downloadWorldAsKaraX(world: World, filename: string = 'kara-world.world') {
  const xml = exportWorldToXml(world);
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.world') ? filename : `${filename}.world`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Detects if content is XML (.world format) or JSON
 */
export function detectWorldFileFormat(content: string): 'xml' | 'json' {
  const trimmed = content.trim();
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<XmlWorld')) {
    return 'xml';
  }
  return 'json';
}

/**
 * Parses world content from either .world (XML) or JSON format
 */
export function parseWorldContent(content: string): World {
  const format = detectWorldFileFormat(content);
  if (format === 'xml') {
    return parseWorldFile(content);
  }
  return JSON.parse(content);
}

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
export function exportProgram(program: Command[]): string {
  return JSON.stringify(program, null, 2);
}

/**
 * Downloads a program as a JSON file
 */
export function downloadProgram(program: Command[], filename: string = 'kara-program.json') {
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

// Constants for world validation
const MIN_WORLD_SIZE = 1;
const MAX_WORLD_SIZE = 100;
const MAX_FILE_SIZE = 1024 * 1024; // 1MB max file size

/**
 * Validates world dimensions are within acceptable ranges
 */
export function validateWorldDimensions(width: unknown, height: unknown): { valid: boolean; error?: string } {
  if (typeof width !== 'number' || typeof height !== 'number') {
    return { valid: false, error: 'Width and height must be numbers' };
  }

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return { valid: false, error: 'Width and height must be finite numbers' };
  }

  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    return { valid: false, error: 'Width and height must be whole numbers' };
  }

  if (width < MIN_WORLD_SIZE || height < MIN_WORLD_SIZE) {
    return { valid: false, error: `World size must be at least ${MIN_WORLD_SIZE}x${MIN_WORLD_SIZE}` };
  }

  if (width > MAX_WORLD_SIZE || height > MAX_WORLD_SIZE) {
    return { valid: false, error: `World size cannot exceed ${MAX_WORLD_SIZE}x${MAX_WORLD_SIZE}` };
  }

  return { valid: true };
}

/**
 * Validates that a cell type is valid
 */
function isValidCellType(type: unknown): type is CellType {
  return Object.values(CellType).includes(type as CellType);
}

/**
 * Validates that a direction is valid
 */
function isValidDirection(direction: unknown): direction is Direction {
  return Object.values(Direction).includes(direction as Direction);
}

/**
 * Validates that an imported world is valid
 * Performs comprehensive validation including type checking and range validation
 */
export function isValidWorld(data: unknown): data is World {
  // Check if data exists and is an object
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // Validate dimensions
  const dimensionValidation = validateWorldDimensions(obj.width, obj.height);
  if (!dimensionValidation.valid) {
    return false;
  }

  const width = obj.width as number;
  const height = obj.height as number;

  // Validate grid structure
  if (!Array.isArray(obj.grid)) {
    return false;
  }

  if (obj.grid.length !== height) {
    return false;
  }

  // Validate each row and cell
  for (let y = 0; y < height; y++) {
    const row = obj.grid[y];
    if (!Array.isArray(row) || row.length !== width) {
      return false;
    }

    for (let x = 0; x < width; x++) {
      const cell = row[x];
      if (!cell || typeof cell !== 'object') {
        return false;
      }
      if (!isValidCellType((cell as Record<string, unknown>).type)) {
        return false;
      }
    }
  }

  // Validate character
  if (!obj.character || typeof obj.character !== 'object') {
    return false;
  }

  const character = obj.character as Record<string, unknown>;

  // Validate character position
  if (!character.position || typeof character.position !== 'object') {
    return false;
  }

  const position = character.position as Record<string, unknown>;
  if (typeof position.x !== 'number' || typeof position.y !== 'number') {
    return false;
  }

  // Position can be -1,-1 (off-map) or within bounds
  const x = position.x;
  const y = position.y;
  const isOffMap = x === -1 && y === -1;
  const isInBounds = x >= 0 && x < width && y >= 0 && y < height;
  if (!isOffMap && !isInBounds) {
    return false;
  }

  // Validate direction
  if (!isValidDirection(character.direction)) {
    return false;
  }

  // Validate inventory
  if (typeof character.inventory !== 'number' ||
      !Number.isFinite(character.inventory) ||
      character.inventory < 0 ||
      !Number.isInteger(character.inventory)) {
    return false;
  }

  return true;
}

/**
 * Safely parses JSON content with size limit check
 * Returns parsed data or throws a user-friendly error
 */
export function safeParseJSON(content: string): unknown {
  // Check file size
  if (content.length > MAX_FILE_SIZE) {
    throw new Error('File is too large. Maximum file size is 1MB.');
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new Error('Invalid file format. The file does not contain valid data.');
  }
}

/**
 * Validates and returns detailed errors for world data
 */
export function validateWorldData(data: unknown): { valid: boolean; error?: string; world?: World } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'File is empty or not a valid format' };
  }

  const obj = data as Record<string, unknown>;

  // Validate dimensions
  const dimensionValidation = validateWorldDimensions(obj.width, obj.height);
  if (!dimensionValidation.valid) {
    return { valid: false, error: dimensionValidation.error };
  }

  // Validate grid
  if (!Array.isArray(obj.grid)) {
    return { valid: false, error: 'World data is missing the grid' };
  }

  // Validate character
  if (!obj.character || typeof obj.character !== 'object') {
    return { valid: false, error: 'World data is missing character information' };
  }

  // Full validation
  if (!isValidWorld(data)) {
    return { valid: false, error: 'World data is corrupted or incomplete' };
  }

  return { valid: true, world: data as World };
}
