import { describe, it, expect } from 'vitest';
import {
  parseWorldFile,
  exportWorldToXml,
  detectWorldFileFormat,
  parseWorldContent,
} from './worldTemplates';
import { World, CellType, Direction } from './types';

describe('World Templates - KaraX .world format', () => {
  const sampleWorldXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<XmlWorld sizex="9" sizey="9" version="KaraX 1.0 kara">
    <XmlWallPoints>
        <XmlPoint x="1" y="5"/>
        <XmlPoint x="2" y="5"/>
        <XmlPoint x="3" y="5"/>
    </XmlWallPoints>
    <XmlObstaclePoints>
        <XmlPoint x="4" y="4"/>
    </XmlObstaclePoints>
    <XmlPaintedfieldPoints>
        <XmlPoint type="0" x="1" y="3"/>
    </XmlPaintedfieldPoints>
    <XmlKaraList>
        <XmlKara direction="2" name="Kara" x="1" y="3"/>
    </XmlKaraList>
    <XmlStreetList/>
</XmlWorld>`;

  describe('parseWorldFile', () => {
    it('should parse world dimensions correctly', () => {
      const world = parseWorldFile(sampleWorldXml);
      expect(world.width).toBe(9);
      expect(world.height).toBe(9);
    });

    it('should parse trees/walls correctly', () => {
      const world = parseWorldFile(sampleWorldXml);
      expect(world.grid[5][1].type).toBe(CellType.Tree);
      expect(world.grid[5][2].type).toBe(CellType.Tree);
      expect(world.grid[5][3].type).toBe(CellType.Tree);
    });

    it('should parse mushrooms/obstacles correctly', () => {
      const world = parseWorldFile(sampleWorldXml);
      expect(world.grid[4][4].type).toBe(CellType.Mushroom);
    });

    it('should parse clovers correctly', () => {
      const world = parseWorldFile(sampleWorldXml);
      expect(world.grid[3][1].type).toBe(CellType.Clover);
    });

    it('should parse Kara position and direction correctly', () => {
      const world = parseWorldFile(sampleWorldXml);
      expect(world.character.position.x).toBe(1);
      expect(world.character.position.y).toBe(3);
      // direction="2" maps to South
      expect(world.character.direction).toBe(Direction.South);
    });

  });

  describe('exportWorldToXml', () => {
    it('should export world dimensions correctly', () => {
      const world: World = {
        width: 5,
        height: 4,
        grid: Array(4)
          .fill(null)
          .map(() => Array(5).fill({ type: CellType.Empty })),
        character: {
          position: { x: 2, y: 1 },
          direction: Direction.East,
        },
      };

      const xml = exportWorldToXml(world);
      expect(xml).toContain('sizex="5"');
      expect(xml).toContain('sizey="4"');
    });

    it('should export Kara position and direction correctly', () => {
      const world: World = {
        width: 5,
        height: 4,
        grid: Array(4)
          .fill(null)
          .map(() => Array(5).fill({ type: CellType.Empty })),
        character: {
          position: { x: 2, y: 1 },
          direction: Direction.East, // direction 1
        },
      };

      const xml = exportWorldToXml(world);
      expect(xml).toContain('x="2"');
      expect(xml).toContain('y="1"');
      expect(xml).toContain('direction="1"');
    });

    it('should export trees as XmlWallPoints', () => {
      const grid = Array(4)
        .fill(null)
        .map(() =>
          Array(5)
            .fill(null)
            .map(() => ({ type: CellType.Empty }))
        );
      grid[2][3] = { type: CellType.Tree };

      const world: World = {
        width: 5,
        height: 4,
        grid,
        character: {
          position: { x: 0, y: 0 },
          direction: Direction.North,
        },
      };

      const xml = exportWorldToXml(world);
      expect(xml).toContain('<XmlWallPoints>');
      expect(xml).toContain('<XmlPoint x="3" y="2"/>');
    });

    it('should export mushrooms as XmlObstaclePoints', () => {
      const grid = Array(4)
        .fill(null)
        .map(() =>
          Array(5)
            .fill(null)
            .map(() => ({ type: CellType.Empty }))
        );
      grid[1][2] = { type: CellType.Mushroom };

      const world: World = {
        width: 5,
        height: 4,
        grid,
        character: {
          position: { x: 0, y: 0 },
          direction: Direction.North,
        },
      };

      const xml = exportWorldToXml(world);
      expect(xml).toContain('<XmlObstaclePoints>');
      expect(xml).toContain('<XmlPoint x="2" y="1"/>');
    });

    it('should export clovers as XmlPaintedfieldPoints', () => {
      const grid = Array(4)
        .fill(null)
        .map(() =>
          Array(5)
            .fill(null)
            .map(() => ({ type: CellType.Empty }))
        );
      grid[0][4] = { type: CellType.Clover };

      const world: World = {
        width: 5,
        height: 4,
        grid,
        character: {
          position: { x: 0, y: 0 },
          direction: Direction.North,
        },
      };

      const xml = exportWorldToXml(world);
      expect(xml).toContain('<XmlPaintedfieldPoints>');
      expect(xml).toContain('<XmlPoint type="0" x="4" y="0"/>');
    });
  });

  describe('round-trip parsing', () => {
    it('should preserve world data through export and re-import', () => {
      const originalWorld: World = {
        width: 6,
        height: 5,
        grid: Array(5)
          .fill(null)
          .map(() =>
            Array(6)
              .fill(null)
              .map(() => ({ type: CellType.Empty }))
          ),
        character: {
          position: { x: 3, y: 2 },
          direction: Direction.West,
        },
      };

      // Add some objects
      originalWorld.grid[1][2] = { type: CellType.Tree };
      originalWorld.grid[3][4] = { type: CellType.Mushroom };
      originalWorld.grid[0][0] = { type: CellType.Clover };

      // Export and re-import
      const xml = exportWorldToXml(originalWorld);
      const reimportedWorld = parseWorldFile(xml);

      // Check dimensions
      expect(reimportedWorld.width).toBe(originalWorld.width);
      expect(reimportedWorld.height).toBe(originalWorld.height);

      // Check character
      expect(reimportedWorld.character.position).toEqual(originalWorld.character.position);
      expect(reimportedWorld.character.direction).toBe(originalWorld.character.direction);

      // Check objects
      expect(reimportedWorld.grid[1][2].type).toBe(CellType.Tree);
      expect(reimportedWorld.grid[3][4].type).toBe(CellType.Mushroom);
      expect(reimportedWorld.grid[0][0].type).toBe(CellType.Clover);
    });
  });

  describe('detectWorldFileFormat', () => {
    it('should detect XML format', () => {
      expect(detectWorldFileFormat('<?xml version="1.0"?><XmlWorld/>')).toBe('xml');
      expect(detectWorldFileFormat('<XmlWorld sizex="5">')).toBe('xml');
    });

    it('should detect JSON format', () => {
      expect(detectWorldFileFormat('{"width": 5, "height": 5}')).toBe('json');
      expect(detectWorldFileFormat('  { "grid": [] }')).toBe('json');
    });
  });

  describe('parseWorldContent', () => {
    it('should parse XML content', () => {
      const world = parseWorldContent(sampleWorldXml);
      expect(world.width).toBe(9);
      expect(world.height).toBe(9);
    });

    it('should parse JSON content', () => {
      const jsonContent = JSON.stringify({
        width: 5,
        height: 4,
        grid: Array(4)
          .fill(null)
          .map(() => Array(5).fill({ type: CellType.Empty })),
        character: {
          position: { x: 2, y: 1 },
          direction: Direction.North,
        },
      });

      const world = parseWorldContent(jsonContent);
      expect(world.width).toBe(5);
      expect(world.height).toBe(4);
    });
  });
});
