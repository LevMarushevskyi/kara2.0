import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CellType, World } from '@/models/types';
import { parseWorldContent } from '@/models/worldTemplates';
import { DragEvent } from 'react';
import { Trash2, Download, Upload, Save, Folder, Eraser } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';

// Special type for Kara placement
export type EditorObjectType = CellType | 'KARA';

interface WorldEditorProps {
  onSelectObject: (cellType: CellType | null | 'KARA') => void;
  selectedObject: CellType | null | 'KARA';
  onClearWorld: () => void;
  onExportWorld: () => void;
  onImportWorld: (world: World) => void;
  onSaveTemplate: (name: string) => void;
  onLoadTemplate: (name: string) => void;
}

const objects = [
  { type: 'KARA' as const, icon: '🐞', label: 'Kara' },
  { type: CellType.Clover, icon: '🍀', label: 'Clover' },
  { type: CellType.Mushroom, icon: '🍄', label: 'Mushroom' },
  { type: CellType.Tree, icon: '🌳', label: 'Tree' },
];

const WorldEditor = ({
  onSelectObject,
  selectedObject,
  onClearWorld,
  onExportWorld,
  onImportWorld,
  onSaveTemplate,
  onLoadTemplate,
}: WorldEditorProps) => {
  const [showTemplates, setShowTemplates] = useState(false);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, cellType: CellType | 'KARA') => {
    e.dataTransfer.setData('cellType', cellType);
    e.dataTransfer.effectAllowed = 'copy';

    // Create a custom drag image showing the emoji
    const dragImage = document.createElement('div');
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.fontSize = '32px';
    dragImage.style.padding = '8px';
    dragImage.style.background = 'rgba(255, 255, 255, 0.9)';
    dragImage.style.borderRadius = '8px';
    dragImage.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';

    const obj = objects.find(o => o.type === cellType);
    if (obj) {
      dragImage.textContent = obj.icon;
    }

    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 20, 20);

    // Clean up the drag image after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.world,.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const world = parseWorldContent(content);
          onImportWorld(world);
          toast.success('World imported successfully!');
        } catch (error) {
          toast.error('Failed to import world. Invalid file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the entire world?')) {
      onClearWorld();
      toast.success('World cleared!');
    }
  };

  const templates = [
    { name: 'Empty Grid', description: 'Start fresh with an empty grid' },
    { name: 'Maze', description: 'A simple maze with trees' },
    { name: 'Garden', description: 'A garden filled with clovers' },
    { name: 'Obstacle Course', description: 'Trees and mushrooms to navigate' },
  ];

  return (
    <>
      <Card className="p-4">
        <h3
          className="text-sm font-semibold mb-3 flex items-center gap-2"
          id="world-editor-heading"
        >
          <span className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-xs">
            🌍
          </span>
          World Editor
        </h3>

        {/* Object Palette */}
        <div
          className="grid grid-cols-2 gap-2 mb-3"
          role="radiogroup"
          aria-labelledby="world-editor-heading"
        >
          {objects.map((obj) => (
            <div
              key={obj.type}
              draggable
              onDragStart={(e) => handleDragStart(e, obj.type)}
              onClick={() => {
                // Toggle selection: deselect if already selected, select otherwise
                if (selectedObject === obj.type) {
                  onSelectObject(undefined);
                } else {
                  onSelectObject(obj.type);
                }
              }}
              role="radio"
              aria-checked={selectedObject === obj.type}
              tabIndex={selectedObject === obj.type ? 0 : -1}
              aria-label={`Select ${obj.label} for placement`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  // Toggle selection: deselect if already selected, select otherwise
                  if (selectedObject === obj.type) {
                    onSelectObject(undefined);
                  } else {
                    onSelectObject(obj.type);
                  }
                }
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg cursor-pointer transition-all border-2 group focus:outline-none focus:ring-2 focus:ring-accent
                ${
                  selectedObject === obj.type
                    ? 'bg-accent border-accent shadow-lg scale-105'
                    : 'bg-secondary hover:bg-secondary/80 border-border/50 hover:border-accent/50'
                }`}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {obj.icon}
              </span>
              <span className="text-xs font-medium text-center">{obj.label}</span>
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground mb-3 text-center">
          {selectedObject === undefined
            ? 'Select a tool above to edit the grid'
            : selectedObject === null
            ? 'Click on grid cells to erase'
            : 'Click to paint or drag to grid'}
        </div>

        {/* Editor Actions */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="gap-2"
              aria-label="Clear entire world grid"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </Button>
            <Button
              variant={selectedObject === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                // Toggle eraser: deselect if already selected, select otherwise
                if (selectedObject === null) {
                  onSelectObject(undefined);
                } else {
                  onSelectObject(null);
                }
              }}
              className="gap-2"
              aria-label="Select eraser tool"
              aria-pressed={selectedObject === null}
            >
              <Eraser className="h-3 w-3" />
              Eraser
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExportWorld}
              className="gap-2"
              aria-label="Export world to .world file"
            >
              <Download className="h-3 w-3" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
              className="gap-2"
              aria-label="Import world from .world or JSON file"
            >
              <Upload className="h-3 w-3" />
              Import
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplates(true)}
            className="w-full gap-2"
            aria-label="Open world templates"
          >
            <Folder className="h-3 w-3" />
            Templates
          </Button>
        </div>
      </Card>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>World Templates</DialogTitle>
            <DialogDescription>Choose a pre-built world template to get started</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {templates.map((template) => (
              <Button
                key={template.name}
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => {
                  onLoadTemplate(template.name);
                  setShowTemplates(false);
                  toast.success(`Loaded template: ${template.name}`);
                }}
              >
                <div className="text-left">
                  <div className="font-semibold">{template.name}</div>
                  <div className="text-xs text-muted-foreground">{template.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorldEditor;
