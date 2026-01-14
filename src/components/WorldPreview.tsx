import { World, CellType, Direction } from '@/models/types';
import { Bug } from 'lucide-react';
import { useMemo } from 'react';
import { GridColorTheme, ViewMode, gridColorStyles } from '@/hooks/useSettings';

interface WorldPreviewProps {
  world: World;
  gridColorTheme?: GridColorTheme;
  viewMode?: ViewMode;
  previewHeight?: number;  // Height of the preview container in pixels
  cellSize?: number;       // Size of each cell in the preview
}

const WorldPreview = ({
  world,
  gridColorTheme = 'green',
  viewMode = 'normal',
  previewHeight = 200,
  cellSize = 36,  // Slightly smaller cells for preview
}: WorldPreviewProps) => {
  // Calculate how many cells can fit in the viewport
  const viewportCellsX = Math.floor(previewHeight / cellSize);  // Square viewport
  const viewportCellsY = Math.floor(previewHeight / cellSize);

  // Calculate the offset to center Kara in the viewport
  const { offsetX, offsetY } = useMemo(() => {
    const karaX = world.character.position.x;
    const karaY = world.character.position.y;

    // Calculate ideal offset to center Kara
    let idealOffsetX = karaX - Math.floor(viewportCellsX / 2);
    let idealOffsetY = karaY - Math.floor(viewportCellsY / 2);

    // Clamp offset to ensure we don't show outside the grid
    // Minimum offset is 0 (can't scroll past the left/top edge)
    // Maximum offset is (gridSize - viewportSize) to not scroll past right/bottom edge
    const maxOffsetX = Math.max(0, world.width - viewportCellsX);
    const maxOffsetY = Math.max(0, world.height - viewportCellsY);

    const clampedOffsetX = Math.max(0, Math.min(idealOffsetX, maxOffsetX));
    const clampedOffsetY = Math.max(0, Math.min(idealOffsetY, maxOffsetY));

    return { offsetX: clampedOffsetX, offsetY: clampedOffsetY };
  }, [world.character.position.x, world.character.position.y, world.width, world.height, viewportCellsX, viewportCellsY]);

  // Calculate visible cells range
  const visibleStartX = offsetX;
  const visibleEndX = Math.min(offsetX + viewportCellsX, world.width);
  const visibleStartY = offsetY;
  const visibleEndY = Math.min(offsetY + viewportCellsY, world.height);

  // Get color styles
  const colorStyle = gridColorStyles[gridColorTheme];

  // Direction rotation helper
  const getDirectionRotation = (direction: Direction): number => {
    switch (direction) {
      case Direction.North: return -90;
      case Direction.East: return 0;
      case Direction.South: return 90;
      case Direction.West: return 180;
    }
  };

  // Cell emoji helper
  const getCellEmoji = (type: CellType): string => {
    switch (type) {
      case CellType.Clover: return '🍀';
      case CellType.Mushroom: return '🍄';
      case CellType.Tree: return '🪾';
      default: return '';
    }
  };

  // Build the visible grid
  const visibleRows: { x: number; y: number; type: CellType; isKara: boolean }[][] = [];
  for (let y = visibleStartY; y < visibleEndY; y++) {
    const row: { x: number; y: number; type: CellType; isKara: boolean }[] = [];
    for (let x = visibleStartX; x < visibleEndX; x++) {
      row.push({
        x,
        y,
        type: world.grid[y][x].type,
        isKara: world.character.position.x === x && world.character.position.y === y,
      });
    }
    visibleRows.push(row);
  }

  return (
    <div
      className="flex items-center justify-center overflow-hidden relative"
      style={{ height: previewHeight, width: '100%' }}
    >
      <div
        className="grid gap-0.5 bg-muted/30 p-1 rounded-lg"
        style={{
          gridTemplateColumns: `repeat(${visibleEndX - visibleStartX}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${visibleEndY - visibleStartY}, ${cellSize}px)`,
        }}
      >
        {visibleRows.map((row) =>
          row.map((cell) => (
            <div
              key={`${cell.x}-${cell.y}`}
              className={`
                rounded-sm border flex items-center justify-center relative
                ${colorStyle.cell} ${colorStyle.cellDark}
                ${cell.isKara ? 'ring-2 ring-accent' : ''}
              `}
              style={{ width: cellSize, height: cellSize }}
            >
              {/* Cell Content */}
              {cell.type !== CellType.Empty && (
                <span
                  className={`${cell.isKara ? 'opacity-40 absolute' : ''}`}
                  style={{ fontSize: cellSize * 0.55 }}
                >
                  {getCellEmoji(cell.type)}
                </span>
              )}

              {/* Kara */}
              {cell.isKara && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div
                    style={{
                      transform: `rotate(${getDirectionRotation(world.character.direction)}deg)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                  >
                    <Bug className="text-red-500" size={cellSize * 0.6} />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Position indicator (shows where in the grid we are) */}
      {(world.width > viewportCellsX || world.height > viewportCellsY) && (
        <div className="absolute bottom-1 right-1 text-[10px] text-muted-foreground bg-background/80 px-1 rounded">
          {world.character.position.x + 1},{world.character.position.y + 1}
        </div>
      )}
    </div>
  );
};

export default WorldPreview;
