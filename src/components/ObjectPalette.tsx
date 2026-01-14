import { Card } from '@/components/ui/card';
import { CellType } from '@/models/types';
import { DragEvent } from 'react';

interface ObjectPaletteProps {
  onSelectObject: (cellType: CellType) => void;
}

const objects = [
  { type: CellType.Clover, icon: '🍀', label: 'Clover' },
  { type: CellType.Mushroom, icon: '🍄', label: 'Mushroom' },
  { type: CellType.Tree, icon: '🪾', label: 'Tree' },
];

const ObjectPalette = ({ onSelectObject }: ObjectPaletteProps) => {
  const handleDragStart = (e: DragEvent<HTMLDivElement>, cellType: CellType) => {
    e.dataTransfer.setData('cellType', cellType);
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <span className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-xs">
          🌍
        </span>
        World Objects
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {objects.map((obj) => (
          <div
            key={obj.type}
            draggable
            onDragStart={(e) => handleDragStart(e, obj.type)}
            onClick={() => onSelectObject(obj.type)}
            className="flex flex-col items-center gap-1 p-3 bg-secondary hover:bg-secondary/80 rounded-lg cursor-move transition-colors border border-border/50 hover:border-accent/50 group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">{obj.icon}</span>
            <span className="text-xs font-medium text-center">{obj.label}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3 text-center">Drag objects to the grid</p>
    </Card>
  );
};

export default ObjectPalette;
