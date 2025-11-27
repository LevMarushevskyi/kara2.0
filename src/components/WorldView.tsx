import { World, CellType, Direction, Position } from '@/models/types';
import { Bug } from 'lucide-react';
import { DragEvent } from 'react';

interface WorldViewProps {
  world: World;
  onCellClick?: (position: Position) => void;
  onCellDrop?: (position: Position, cellType: CellType) => void;
  selectedObject?: CellType | null;
}

const WorldView = ({ world, onCellClick, onCellDrop, selectedObject }: WorldViewProps) => {
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

  const getCellEmoji = (cellType: CellType): string => {
    switch (cellType) {
      case CellType.Clover:
        return '🍀';
      case CellType.Mushroom:
        return '🍄';
      case CellType.Tree:
        return '🌳';
      case CellType.Wall:
        return '🧱';
      default:
        return '';
    }
  };

  const handleCellClick = (x: number, y: number) => {
    if (onCellClick && selectedObject) {
      onCellClick({ x, y });
    }
  };

  const handleCellDrop = (e: DragEvent<HTMLDivElement>, x: number, y: number) => {
    e.preventDefault();
    const cellType = e.dataTransfer.getData('cellType') as CellType;
    if (cellType && onCellDrop) {
      onCellDrop({ x, y }, cellType);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="inline-block p-6 bg-card rounded-xl border border-border shadow-lg">
      <div
        className="grid gap-1 bg-muted/30 p-4 rounded-lg"
        style={{
          gridTemplateColumns: `repeat(${world.width}, 1fr)`,
          gridTemplateRows: `repeat(${world.height}, 1fr)`,
        }}
      >
        {world.grid.map((row, y) =>
          row.map((cell, x) => {
            const isCharacter =
              world.character.position.x === x && world.character.position.y === y;

            return (
              <div
                key={`${x}-${y}`}
                onClick={() => handleCellClick(x, y)}
                onDrop={(e) => handleCellDrop(e, x, y)}
                onDragOver={handleDragOver}
                className={`
                  w-14 h-14 rounded-md border-2 flex items-center justify-center
                  transition-all duration-300 relative
                  ${
                    cell.type === CellType.Empty
                      ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200/50 dark:from-green-950/20 dark:to-green-900/20 dark:border-green-800/30'
                      : cell.type === CellType.Wall
                      ? 'bg-primary border-primary/50'
                      : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200/50 dark:from-green-950/20 dark:to-green-900/20 dark:border-green-800/30'
                  }
                  ${isCharacter ? 'ring-2 ring-accent ring-offset-2' : ''}
                  ${selectedObject ? 'cursor-pointer hover:ring-2 hover:ring-accent/50' : ''}
                `}
              >
                {/* Cell Content (show behind character if present) */}
                {cell.type !== CellType.Empty && (
                  <span className={`text-2xl ${isCharacter ? 'opacity-40 absolute' : ''}`}>
                    {getCellEmoji(cell.type)}
                  </span>
                )}
                
                {/* Character */}
                {isCharacter && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div
                      className="relative"
                      style={{
                        transform: `rotate(${getDirectionRotation(world.character.direction)}deg)`,
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      <Bug className="text-red-500 drop-shadow-lg" size={32} />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="mt-4 text-center text-sm text-muted-foreground space-y-1">
        <div>
          Position: ({world.character.position.x}, {world.character.position.y}) | 
          Facing: {world.character.direction}
        </div>
        <div className="flex items-center justify-center gap-2 text-accent font-medium">
          <span>🍀 Inventory: {world.character.inventory}</span>
        </div>
      </div>
    </div>
  );
};

export default WorldView;
