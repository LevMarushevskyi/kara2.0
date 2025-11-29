import { World, CellType, Direction, Position } from '@/models/types';
import { Bug } from 'lucide-react';
import { DragEvent, useState, useRef, memo } from 'react';

interface WorldViewProps {
  world: World;
  onCellClick?: (position: Position) => void;
  onCellDrop?: (position: Position, cellType: CellType | 'KARA') => void;
  selectedObject?: CellType | null | 'KARA';
}

// Memoized cell component to prevent unnecessary re-renders
interface CellProps {
  x: number;
  y: number;
  cellType: CellType;
  isCharacter: boolean;
  characterDirection: Direction;
  selectedObject?: CellType | null | 'KARA';
  onMouseDown: (x: number, y: number) => void;
  onMouseUp: (x: number, y: number) => void;
  onMouseEnter: (x: number, y: number) => void;
  onClick: (x: number, y: number) => void;
  onDrop: (e: DragEvent<HTMLDivElement>, x: number, y: number) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, x: number, y: number) => void;
  isDragging: boolean;
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
  isDragging
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

  return (
    <div
      draggable={selectedObject === undefined && (isCharacter || cellType !== CellType.Empty)}
      onClick={() => onClick(x, y)}
      onMouseDown={() => onMouseDown(x, y)}
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
        bg-gradient-to-br from-green-50 to-green-100 border-green-200/50 dark:from-green-950/20 dark:to-green-900/20 dark:border-green-800/30
        ${isCharacter ? 'ring-2 ring-accent ring-offset-2' : ''}
        ${selectedObject !== undefined ? 'cursor-pointer hover:ring-2 hover:ring-accent/50' : 'hover:border-green-300 dark:hover:border-green-700'}
        ${isDragging && selectedObject === undefined ? 'cursor-grabbing' : selectedObject === undefined && (isCharacter || cellType !== CellType.Empty) ? 'cursor-grab' : ''}
      `}
      style={{
        willChange: isDragging || selectedObject !== undefined ? 'transform' : 'auto',
      }}
    >
      {/* Cell Content (show behind character if present) */}
      {cellType !== CellType.Empty && (
        <span
          className={`text-2xl transition-all duration-300 ${isCharacter ? 'opacity-40 absolute' : ''}`}
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
    prevProps.isDragging === nextProps.isDragging
  );
});

Cell.displayName = 'Cell';

const WorldView = ({ world, onCellClick, onCellDrop, selectedObject }: WorldViewProps) => {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const lastPaintedCell = useRef<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<{ type: CellType | 'KARA'; from: Position } | null>(null);

  const handleCellClick = (x: number, y: number) => {
    if (onCellClick && selectedObject !== undefined) {
      onCellClick({ x, y });
    }
  };

  const handleMouseDown = (x: number, y: number) => {
    setIsMouseDown(true);
    lastPaintedCell.current = `${x}-${y}`;

    // When nothing is selected, check if clicking on an element to drag it
    if (selectedObject === undefined && onCellDrop) {
      const isKara = world.character.position.x === x && world.character.position.y === y;
      const cellType = world.grid[y][x].type;

      if (isKara) {
        setDraggedElement({ type: 'KARA', from: { x, y } });
      } else if (cellType !== CellType.Empty) {
        setDraggedElement({ type: cellType, from: { x, y } });
      }
    } else {
      handleCellClick(x, y);
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

    setIsMouseDown(false);
    lastPaintedCell.current = null;
    setDraggedElement(null);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    lastPaintedCell.current = null;
    setDraggedElement(null);
  };

  const handleMouseEnter = (x: number, y: number) => {
    const cellKey = `${x}-${y}`;
    if (isMouseDown && lastPaintedCell.current !== cellKey) {
      lastPaintedCell.current = cellKey;

      // Don't paint when dragging an element
      if (draggedElement) {
        return;
      }

      // Don't paint on Kara's position
      if (world.character.position.x === x && world.character.position.y === y) {
        return;
      }
      handleCellClick(x, y);
    }
  };

  const handleCellDrop = (e: DragEvent<HTMLDivElement>, x: number, y: number) => {
    e.preventDefault();
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
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default WorldView;
