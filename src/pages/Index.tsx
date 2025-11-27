import { useState, useEffect, useCallback } from 'react';
import { Code2 } from 'lucide-react';
import WorldView from '@/components/WorldView';
import ProgrammingPanel from '@/components/ProgrammingPanel';
import ObjectPalette from '@/components/ObjectPalette';
import { createWorld, moveForward, turnLeft, turnRight, resetWorld } from '@/models/world';
import { World, CellType, Position } from '@/models/types';
import { CommandType, createProgram } from '@/models/program';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const Index = () => {
  const [world, setWorld] = useState<World>(() => createWorld(10, 10));
  const [program, setProgram] = useState<CommandType[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [executionSpeed, setExecutionSpeed] = useState(500);
  const [selectedObject, setSelectedObject] = useState<CellType | null>(null);

  const executeCommand = useCallback((command: CommandType) => {
    setWorld((prevWorld) => {
      let newWorld = prevWorld;
      
      switch (command) {
        case CommandType.MoveForward:
          newWorld = moveForward(prevWorld);
          if (newWorld === prevWorld) {
            toast.error('Cannot move forward - blocked!');
          }
          break;
        case CommandType.TurnLeft:
          newWorld = turnLeft(prevWorld);
          break;
        case CommandType.TurnRight:
          newWorld = turnRight(prevWorld);
          break;
        case CommandType.PickClover:
          // TODO: Implement pick logic
          toast.info('Pick clover - coming soon!');
          break;
        case CommandType.PlaceClover:
          // TODO: Implement place logic
          toast.info('Place clover - coming soon!');
          break;
      }
      
      return newWorld;
    });
  }, []);

  const handleRun = () => {
    if (program.length === 0) {
      toast.error('Program is empty!');
      return;
    }
    setIsRunning(true);
    setCurrentStep(0);
    toast.success('Program started!');
  };

  const handlePause = () => {
    setIsRunning(false);
    toast.info('Program paused');
  };

  const handleStep = () => {
    if (program.length === 0) return;
    
    const nextStep = currentStep === -1 ? 0 : currentStep + 1;
    
    if (nextStep >= program.length) {
      setCurrentStep(-1);
      toast.success('Program completed!');
      return;
    }
    
    setCurrentStep(nextStep);
    executeCommand(program[nextStep]);
  };

  const handleAddCommand = (command: CommandType) => {
    setProgram([...program, command]);
  };

  const handleRemoveCommand = (index: number) => {
    setProgram(program.filter((_, i) => i !== index));
  };

  const handleClearProgram = () => {
    setProgram([]);
    setCurrentStep(-1);
    setIsRunning(false);
    toast.info('Program cleared');
  };

  const handleCellClick = (position: Position) => {
    if (!selectedObject) return;
    
    setWorld((prevWorld) => {
      const newGrid = prevWorld.grid.map(row => [...row]);
      
      // Don't place on character position
      if (position.x === prevWorld.character.position.x && 
          position.y === prevWorld.character.position.y) {
        toast.error('Cannot place object on character!');
        return prevWorld;
      }
      
      newGrid[position.y][position.x] = { type: selectedObject };
      return { ...prevWorld, grid: newGrid };
    });
  };

  const handleCellDrop = (position: Position, cellType: CellType) => {
    setWorld((prevWorld) => {
      const newGrid = prevWorld.grid.map(row => [...row]);
      
      // Don't place on character position
      if (position.x === prevWorld.character.position.x && 
          position.y === prevWorld.character.position.y) {
        toast.error('Cannot place object on character!');
        return prevWorld;
      }
      
      newGrid[position.y][position.x] = { type: cellType };
      return { ...prevWorld, grid: newGrid };
    });
  };

  const handleReset = () => {
    setWorld(createWorld(10, 10));
    setProgram([]);
    setCurrentStep(-1);
    setIsRunning(false);
    toast.success('World reset!');
  };

  // Auto-execution when running
  useEffect(() => {
    if (!isRunning || currentStep === -1) return;

    const timer = setTimeout(() => {
      if (currentStep >= program.length - 1) {
        setIsRunning(false);
        setCurrentStep(-1);
        toast.success('Program completed!');
      } else {
        setCurrentStep(currentStep + 1);
        executeCommand(program[currentStep + 1]);
      }
    }, executionSpeed);

    return () => clearTimeout(timer);
  }, [isRunning, currentStep, program, executionSpeed, executeCommand]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Kara Ladybug World</h1>
                <p className="text-xs text-muted-foreground">Programming Environment</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Execution Speed</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">Slow</span>
                  <Slider
                    value={[1000 - executionSpeed]}
                    onValueChange={(value) => setExecutionSpeed(1000 - value[0])}
                    min={200}
                    max={900}
                    step={100}
                    className="w-32"
                  />
                  <span className="text-xs">Fast</span>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-[280px,1fr,280px] gap-6 h-[calc(100vh-140px)]">
          {/* Left Panel - Programming */}
          <div className="animate-in fade-in slide-in-from-left duration-500">
            <ProgrammingPanel
              program={program}
              currentStep={currentStep}
              isRunning={isRunning}
              onAddCommand={handleAddCommand}
              onRemoveCommand={handleRemoveCommand}
              onClearProgram={handleClearProgram}
              onRun={handleRun}
              onPause={handlePause}
              onStep={handleStep}
            />
          </div>

          {/* Center - World View */}
          <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700">
            <WorldView 
              world={world} 
              onCellClick={handleCellClick}
              onCellDrop={handleCellDrop}
              selectedObject={selectedObject}
            />
          </div>

          {/* Right Panel - Objects & Info */}
          <div className="space-y-4 animate-in fade-in slide-in-from-right duration-500">
            <ObjectPalette onSelectObject={setSelectedObject} />
            
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Quick Guide</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>• Drag commands to build a program</p>
                <p>• Drag objects onto the grid</p>
                <p>• Click Run to execute</p>
                <p>• Use Step to debug</p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
