import { World, CellType, Direction } from '@/models/types';
import { Bug } from 'lucide-react';

interface WorldViewProps {
  world: World;
}

const WorldView = ({ world }: WorldViewProps) => {
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
                className={`
                  w-12 h-12 rounded-md border-2 flex items-center justify-center
                  transition-all duration-300
                  ${
                    cell.type === CellType.Wall
                      ? 'bg-primary border-primary/50'
                      : 'bg-background border-border/50'
                  }
                  ${isCharacter ? 'ring-2 ring-accent ring-offset-2' : ''}
                `}
              >
                {isCharacter && (
                  <Bug
                    className="text-accent animate-pulse"
                    size={28}
                    style={{
                      transform: `rotate(${getDirectionRotation(world.character.direction)}deg)`,
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Position: ({world.character.position.x}, {world.character.position.y}) | 
        Facing: {world.character.direction}
      </div>
    </div>
  );
};

export default WorldView;
