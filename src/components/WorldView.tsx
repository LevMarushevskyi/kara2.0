import { World, CellType, Direction, Position } from '@/models/types';
import { Bug } from 'lucide-react';
import { DragEvent, useState, useRef, memo, useMemo } from 'react';
import { GridColorTheme, ViewMode, gridColorStyles } from '@/hooks/useSettings';

interface WorldViewProps {
  world: World;
  onCellClick?: (position: Position, isDragPaint?: boolean) => void;
  onCellDrop?: (position: Position, cellType: CellType | 'KARA') => void;
  selectedObject?: CellType | null | 'KARA';
  gridColorTheme?: GridColorTheme;
  viewMode?: ViewMode;
}

// Memoized cell component to prevent unnecessary re-renders
interface CellProps {
  x: number;
  y: number;
  cellType: CellType;
  isCharacter: boolean;
  characterDirection: Direction;
  selectedObject?: CellType | null | 'KARA';
  onMouseDown: (x: number, y: number, e: React.MouseEvent) => void;
  onMouseUp: (x: number, y: number) => void;
  onMouseEnter: (x: number, y: number) => void;
  onClick: (x: number, y: number, e: React.MouseEvent) => void;
  onDrop: (e: DragEvent<HTMLDivElement>, x: number, y: number) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, x: number, y: number) => void;
  isDragging: boolean;
  gridColorTheme: GridColorTheme;
  isVisibleToKara: boolean;
  viewMode: ViewMode;
}

const Cell = memo(({
  x,
  y,
  cellType,
  isCharacter,
  characterDirection,
  selectedObject,
  onMouseDown,
  onMouseUp,
  onMouseEnter,
  onClick,
  onDrop,
  onDragOver,
  onDragStart,
  isDragging,
  gridColorTheme,
  isVisibleToKara,
  viewMode,
}: CellProps) => {
  const getDirectionRotation = (direction: Direction): number => {
    switch (direction) {
      case Direction.North:
        return 0;
      case Direction.East:
        return 90;
      case Direction.South:
        return 180;
      case Direction.West:
        return 270;
    }
  };

  const getCellEmoji = (type: CellType): string => {
    switch (type) {
      case CellType.Clover:
        return '🍀';
      case CellType.Mushroom:
        return '🍄';
      case CellType.Tree:
        return '🌳';
      default:
        return '';
    }
  };

  const getCellDescription = () => {
    const parts = [`Grid cell at position ${x}, ${y}`];
    if (isCharacter) parts.push('Kara is here');
    if (cellType !== CellType.Empty) {
      const typeNames = {
        [CellType.Clover]: 'Clover',
        [CellType.Mushroom]: 'Mushroom',
        [CellType.Tree]: 'Tree',
        [CellType.Empty]: '',
      };
      parts.push(`Contains ${typeNames[cellType]}`);
    }
    return parts.join('. ');
  };

  // Get grid color styles based on theme
  const colorStyle = gridColorStyles[gridColorTheme];

  // Determine transparency for elements not visible to Kara
  const shouldFade = viewMode === 'transparency' && !isVisibleToKara && cellType !== CellType.Empty;

  // Get hover border color based on theme
  const getHoverBorderClass = () => {
    switch (gridColorTheme) {
      case 'green':
        return 'hover:border-green-300 dark:hover:border-green-700';
      case 'blue':
        return 'hover:border-sky-300 dark:hover:border-sky-700';
      case 'white':
        return 'hover:border-gray-300 dark:hover:border-gray-600';
      case 'dark':
        return 'hover:border-gray-500 dark:hover:border-gray-500';
    }
  };

  return (
    <div
      draggable={selectedObject === undefined && (isCharacter || cellType !== CellType.Empty)}
      onClick={(e) => onClick(x, y, e)}
      onMouseDown={(e) => onMouseDown(x, y, e)}
      onMouseUp={() => onMouseUp(x, y)}
      onMouseEnter={() => onMouseEnter(x, y)}
      onDrop={(e) => onDrop(e, x, y)}
      onDragOver={onDragOver}
      onDragStart={(e) => onDragStart(e, x, y)}
      role="gridcell"
      aria-label={getCellDescription()}
      tabIndex={selectedObject !== undefined ? 0 : -1}
      className={`
        w-14 h-14 rounded-md border-2 flex items-center justify-center
        transition-all duration-150 relative
        ${colorStyle.cell} ${colorStyle.cellDark}
        ${isCharacter ? 'ring-2 ring-accent ring-offset-2' : ''}
        ${selectedObject !== undefined ? 'cursor-pointer hover:ring-2 hover:ring-accent/50' : getHoverBorderClass()}
        ${isDragging && selectedObject === undefined ? 'cursor-grabbing' : selectedObject === undefined && (isCharacter || cellType !== CellType.Empty) ? 'cursor-grab' : ''}
      `}
      style={{
        willChange: isDragging || selectedObject !== undefined ? 'transform' : 'auto',
      }}
    >
      {/* Cell Content (show behind character if present) */}
      {cellType !== CellType.Empty && (
        <span
          className={`text-2xl transition-all duration-300 ${isCharacter ? 'opacity-40 absolute' : ''} ${shouldFade ? 'opacity-25' : ''}`}
          style={{
            animation:
              cellType === CellType.Mushroom ? 'slideIn 0.3s ease-out' : undefined,
          }}
        >
          {getCellEmoji(cellType)}
        </span>
      )}

      {/* Character */}
      {isCharacter && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div
            className="relative"
            style={{
              transform: `rotate(${getDirectionRotation(characterDirection)}deg) translateZ(0)`,
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
            }}
          >
            <Bug className="text-red-500 drop-shadow-lg" size={32} />
          </div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  return (
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.cellType === nextProps.cellType &&
    prevProps.isCharacter === nextProps.isCharacter &&
    prevProps.characterDirection === nextProps.characterDirection &&
    prevProps.selectedObject === nextProps.selectedObject &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.gridColorTheme === nextProps.gridColorTheme &&
    prevProps.isVisibleToKara === nextProps.isVisibleToKara &&
    prevProps.viewMode === nextProps.viewMode
  );
});

Cell.displayName = 'Cell';

const WorldView = ({ world, onCellClick, onCellDrop, selectedObject, gridColorTheme = 'green', viewMode = 'normal' }: WorldViewProps) => {
  // Use refs for mouse state to ensure synchronous updates (React state is async)
  const isMouseDownRef = useRef(false);
  const isPaintingRef = useRef(false); // True when we're actively painting (tool selected + mouse down)
  const startPaintCell = useRef<string | null>(null); // The cell where paint operation started
  const lastPaintedCell = useRef<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<{ type: CellType | 'KARA'; from: Position } | null>(null);

  // Calculate which cells are visible to Kara (for transparency mode)
  // Kara can see: front cell, left cell, right cell, and the cell she's standing on
  const visibleCells = useMemo(() => {
    const visible = new Set<string>();
    const { x, y } = world.character.position;
    const direction = world.character.direction;

    // Kara's current position is always visible
    visible.add(`${x},${y}`);

    // Helper to get position in a direction
    const getPosition = (dir: Direction): { x: number; y: number } => {
      switch (dir) {
        case Direction.North:
          return { x, y: y - 1 };
        case Direction.South:
          return { x, y: y + 1 };
        case Direction.East:
          return { x: x + 1, y };
        case Direction.West:
          return { x: x - 1, y };
      }
    };

    // Get left direction
    const getLeftDir = (dir: Direction): Direction => {
      switch (dir) {
        case Direction.North: return Direction.West;
        case Direction.West: return Direction.South;
        case Direction.South: return Direction.East;
        case Direction.East: return Direction.North;
      }
    };

    // Get right direction
    const getRightDir = (dir: Direction): Direction => {
      switch (dir) {
        case Direction.North: return Direction.East;
        case Direction.East: return Direction.South;
        case Direction.South: return Direction.West;
        case Direction.West: return Direction.North;
      }
    };

    // Front cell
    const front = getPosition(direction);
    if (front.x >= 0 && front.x < world.width && front.y >= 0 && front.y < world.height) {
      visible.add(`${front.x},${front.y}`);
    }

    // Left cell
    const left = getPosition(getLeftDir(direction));
    if (left.x >= 0 && left.x < world.width && left.y >= 0 && left.y < world.height) {
      visible.add(`${left.x},${left.y}`);
    }

    // Right cell
    const right = getPosition(getRightDir(direction));
    if (right.x >= 0 && right.x < world.width && right.y >= 0 && right.y < world.height) {
      visible.add(`${right.x},${right.y}`);
    }

    return visible;
  }, [world.character.position.x, world.character.position.y, world.character.direction, world.width, world.height]);

  // Internal function for painting cells (no event propagation needed)
  // isDragPaint=true means we're dragging to paint (don't toggle, just place)
  // isDragPaint=false means initial click (toggle behavior)
  const paintCell = (x: number, y: number, isDragPaint: boolean = false) => {
    if (onCellClick && selectedObject !== undefined) {
      onCellClick({ x, y }, isDragPaint);
    }
  };

  // Click handler is now only for stopping propagation - actual painting is done in mouseDown
  const handleCellClick = (x: number, y: number, e: React.MouseEvent) => {
    if (selectedObject !== undefined) {
      // Stop propagation to prevent parent panning from triggering
      e.stopPropagation();
      // Don't call onCellClick here - it's handled in mouseDown to avoid double-toggling
    }
  };

  const handleMouseDown = (x: number, y: number, e: React.MouseEvent) => {
    const cellKey = `${x}-${y}`;
    isMouseDownRef.current = true;
    isPaintingRef.current = false; // Reset - we haven't started dragging yet
    startPaintCell.current = cellKey; // Remember where we started
    lastPaintedCell.current = cellKey;

    // When nothing is selected, check if clicking on an element to drag it
    if (selectedObject === undefined && onCellDrop) {
      const isKara = world.character.position.x === x && world.character.position.y === y;
      const cellType = world.grid[y][x].type;

      if (isKara) {
        setDraggedElement({ type: 'KARA', from: { x, y } });
        // Stop propagation to prevent panning while dragging elements
        e.stopPropagation();
      } else if (cellType !== CellType.Empty) {
        setDraggedElement({ type: cellType, from: { x, y } });
        // Stop propagation to prevent panning while dragging elements
        e.stopPropagation();
      }
      // If clicking on empty cell with no tool selected, allow panning (don't stop propagation)
    } else if (selectedObject !== undefined) {
      // Tool is selected - stop propagation to prevent panning
      e.stopPropagation();
      // Paint the cell on mouse down (not on click to avoid double-toggling)
      // isDragPaint=false allows toggle behavior on initial click
      paintCell(x, y, false);
    }
  };

  const handleMouseUpOnCell = (x: number, y: number) => {
    // If we were dragging an element
    if (draggedElement && onCellDrop && onCellClick) {
      const { from, type } = draggedElement;

      // Only move if dropped on a different cell
      if (from.x !== x || from.y !== y) {
        // Clear the source cell first (by setting it to empty)
        onCellClick(from);
        // Then place the element at the new location
        onCellDrop({ x, y }, type);
      }
    }

    isMouseDownRef.current = false;
    isPaintingRef.current = false;
    startPaintCell.current = null;
    lastPaintedCell.current = null;
    setDraggedElement(null);
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    isPaintingRef.current = false;
    startPaintCell.current = null;
    lastPaintedCell.current = null;
    setDraggedElement(null);
  };

  const handleMouseEnter = (x: number, y: number) => {
    const cellKey = `${x}-${y}`;

    // Only process if mouse is down (using ref for synchronous check)
    if (!isMouseDownRef.current) {
      return;
    }

    // Don't paint when dragging an element (moving existing elements)
    if (draggedElement) {
      return;
    }

    // Check if a tool is selected for painting
    if (selectedObject === undefined) {
      return;
    }

    // Skip if this is the same cell we already painted or the starting cell
    // This prevents accidental painting when mouse wobbles during a click
    if (lastPaintedCell.current === cellKey || startPaintCell.current === cellKey) {
      return;
    }

    // We've moved to a different cell - this is now a drag paint operation
    isPaintingRef.current = true;

    // Update last painted cell
    lastPaintedCell.current = cellKey;

    // Don't paint on Kara's position
    if (world.character.position.x === x && world.character.position.y === y) {
      return;
    }

    // isDragPaint=true means don't toggle, just place the element
    paintCell(x, y, true);
  };

  const handleCellDrop = (e: DragEvent<HTMLDivElement>, x: number, y: number) => {
    e.preventDefault();

    // If we're using mouse-based drag (draggedElement is set), skip HTML5 drop handling
    // to avoid duplicate placement - the mouse-based system handles it in handleMouseUpOnCell
    if (draggedElement) {
      return;
    }

    const cellType = e.dataTransfer.getData('cellType') as CellType | 'KARA';
    const sourceX = e.dataTransfer.getData('sourceX');
    const sourceY = e.dataTransfer.getData('sourceY');

    if (cellType && onCellDrop && onCellClick) {
      // If dragging from grid (has source coordinates), clear the source cell first
      if (sourceX && sourceY) {
        const srcX = parseInt(sourceX);
        const srcY = parseInt(sourceY);

        // Don't do anything if dropping on the same cell
        if (srcX === x && srcY === y) {
          return;
        }

        // Clear the source cell
        onCellClick({ x: srcX, y: srcY });
      }

      // Place the element at the new location
      onCellDrop({ x, y }, cellType);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleCellDragStart = (e: DragEvent<HTMLDivElement>, x: number, y: number) => {
    if (selectedObject !== undefined) return; // Only allow dragging when no tool is selected

    // If mouse-based drag is active, prevent HTML5 drag from also starting
    if (draggedElement) {
      e.preventDefault();
      return;
    }

    const isKara = world.character.position.x === x && world.character.position.y === y;
    const cellType = world.grid[y][x].type;

    let dragType: CellType | 'KARA' | null = null;
    let emoji = '';

    if (isKara) {
      dragType = 'KARA';
      emoji = '🐞';
    } else if (cellType !== CellType.Empty) {
      dragType = cellType;
      switch (cellType) {
        case CellType.Clover:
          emoji = '🍀';
          break;
        case CellType.Mushroom:
          emoji = '🍄';
          break;
        case CellType.Tree:
          emoji = '🌳';
          break;
      }
    }

    if (dragType) {
      e.dataTransfer.setData('cellType', dragType);
      e.dataTransfer.effectAllowed = 'move';

      // Store the source position to clear it on drop
      e.dataTransfer.setData('sourceX', x.toString());
      e.dataTransfer.setData('sourceY', y.toString());

      // Create a custom drag image showing the emoji
      const dragImage = document.createElement('div');
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      dragImage.style.fontSize = '32px';
      dragImage.style.padding = '8px';
      dragImage.style.background = 'rgba(255, 255, 255, 0.9)';
      dragImage.style.borderRadius = '8px';
      dragImage.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      dragImage.textContent = emoji;

      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 20, 20);

      // Clean up the drag image after a short delay
      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);
    }
  };

  return (
    <div
      className="inline-block p-6 bg-card rounded-xl border border-border shadow-lg"
      role="region"
      aria-label="Kara's World"
    >
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: scale(0.8);
              opacity: 0.6;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
      <div
        className="grid gap-1 bg-muted/30 p-4 rounded-lg select-none"
        style={{
          gridTemplateColumns: `repeat(${world.width}, 1fr)`,
          gridTemplateRows: `repeat(${world.height}, 1fr)`,
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        role="grid"
        aria-label={`${world.width} by ${world.height} grid world`}
      >
        {world.grid.map((row, y) =>
          row.map((cell, x) => {
            const isCharacter =
              world.character.position.x === x && world.character.position.y === y;
            const isVisibleToKara = visibleCells.has(`${x},${y}`);

            return (
              <Cell
                key={`${x}-${y}`}
                x={x}
                y={y}
                cellType={cell.type}
                isCharacter={isCharacter}
                characterDirection={world.character.direction}
                selectedObject={selectedObject}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUpOnCell}
                onMouseEnter={handleMouseEnter}
                onClick={handleCellClick}
                onDrop={handleCellDrop}
                onDragOver={handleDragOver}
                onDragStart={handleCellDragStart}
                isDragging={!!draggedElement}
                gridColorTheme={gridColorTheme}
                isVisibleToKara={isVisibleToKara}
                viewMode={viewMode}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default WorldView;
