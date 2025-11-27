import { useState, useEffect, useCallback } from 'react';
import { Code2, List } from 'lucide-react';
import WorldView from '@/components/WorldView';
import ProgrammingPanel from '@/components/ProgrammingPanel';
import ObjectPalette from '@/components/ObjectPalette';
import LevelSelector from '@/components/LevelSelector';
import LevelCompleteDialog from '@/components/LevelCompleteDialog';
import { createWorld, moveForward, turnLeft, turnRight, resetWorld, pickClover, placeClover } from '@/models/world';
import { World, CellType, Position } from '@/models/types';
import { CommandType, createProgram } from '@/models/program';
import { Scenario, saveProgress } from '@/models/scenario';
import { scenarios, getScenarioById } from '@/models/scenarios';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';

const Index = () => {
  const [currentScenario, setCurrentScenario] = useState<Scenario>(scenarios[0]);
  const [world, setWorld] = useState<World>(scenarios[0].world);
  const [program, setProgram] = useState<CommandType[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [executionSpeed, setExecutionSpeed] = useState(500);
  const [selectedObject, setSelectedObject] = useState<CellType | null>(null);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [levelCompleteData, setLevelCompleteData] = useState<{
    stars: number;
    commandCount: number;
  }>({ stars: 0, commandCount: 0 });

  const loadScenario = useCallback((scenarioId: string) => {
    const scenario = getScenarioById(scenarioId);
    if (!scenario) return;

    setCurrentScenario(scenario);
    setWorld(JSON.parse(JSON.stringify(scenario.world))); // Deep copy
    setProgram([]);
    setCurrentStep(-1);
    setIsRunning(false);
    setShowLevelComplete(false);
    toast.success(`Level loaded: ${scenario.title}`);
  }, []);

  const checkGoalCondition = useCallback(() => {
    if (currentScenario.goalCondition.check(world)) {
      setIsRunning(false);
      const commandCount = program.length;
      const stars = commandCount <= 5 ? 3 : commandCount <= 10 ? 2 : 1;
      
      saveProgress(currentScenario.id, commandCount);
      
      setLevelCompleteData({ stars, commandCount });
      setShowLevelComplete(true);
      
      // Confetti effect via toast
      toast.success('🎉 Level Complete!', {
        description: `Solved in ${commandCount} commands!`,
      });
    }
  }, [world, currentScenario, program.length]);

  const executeCommand = useCallback((command: CommandType, shouldCheckGoal = true) => {
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
          newWorld = pickClover(prevWorld);
          if (newWorld === prevWorld) {
            toast.error('No clover here to pick!');
          } else {
            toast.success('Picked up clover! 🍀');
          }
          break;
        case CommandType.PlaceClover:
          newWorld = placeClover(prevWorld);
          if (newWorld === prevWorld) {
            if (prevWorld.character.inventory === 0) {
              toast.error('No clovers in inventory!');
            } else {
              toast.error('Cannot place clover here!');
            }
          } else {
            toast.success('Placed clover! 🍀');
          }
          break;
      }
      
      return newWorld;
    });
    
    // Check goal after state update
    if (shouldCheckGoal) {
      setTimeout(() => checkGoalCondition(), 100);
    }
  }, [checkGoalCondition]);

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
    // Check if command is allowed in current scenario
    if (!currentScenario.allowedCommands.includes(command)) {
      toast.error('This command is not allowed in this level!');
      return;
    }
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
    loadScenario(currentScenario.id);
  };

  const handleNextLevel = () => {
    const currentIndex = scenarios.findIndex(s => s.id === currentScenario.id);
    if (currentIndex < scenarios.length - 1) {
      loadScenario(scenarios[currentIndex + 1].id);
    }
  };

  const handleRetry = () => {
    setShowLevelComplete(false);
    handleReset();
  };

  // Auto-execution when running
  useEffect(() => {
    if (!isRunning || currentStep === -1) return;

    // Execute the current command first
    executeCommand(program[currentStep]);

    const timer = setTimeout(() => {
      if (currentStep >= program.length - 1) {
        setIsRunning(false);
        setCurrentStep(-1);
        toast.success('Program completed!');
      } else {
        setCurrentStep(currentStep + 1);
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
                <p className="text-xs text-muted-foreground">
                  {currentScenario.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLevelSelector(true)}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                Levels
              </Button>
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
            <Card className="p-4 mb-4 bg-muted/30">
              <h3 className="text-sm font-semibold mb-2">Goal</h3>
              <p className="text-xs text-muted-foreground">
                {currentScenario.goalCondition.description}
              </p>
              {currentScenario.hints && currentScenario.hints.length > 0 && (
                <details className="mt-3">
                  <summary className="text-xs font-medium cursor-pointer hover:text-accent">
                    💡 Hints
                  </summary>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {currentScenario.hints.map((hint, i) => (
                      <li key={i}>• {hint}</li>
                    ))}
                  </ul>
                </details>
              )}
            </Card>
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

          {/* Right Panel - Info */}
          <div className="space-y-4 animate-in fade-in slide-in-from-right duration-500">
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Level Info</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Difficulty:</span>
                  <span className="font-medium capitalize">{currentScenario.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commands:</span>
                  <span className="font-medium">{currentScenario.allowedCommands.length}</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Quick Guide</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>• Drag commands to build a program</p>
                <p>• Click Run to execute all steps</p>
                <p>• Use Step to debug one at a time</p>
                <p>• Complete the goal to win!</p>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Level Selector Dialog */}
      <Dialog open={showLevelSelector} onOpenChange={setShowLevelSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <LevelSelector
            currentScenarioId={currentScenario.id}
            onSelectScenario={loadScenario}
            onClose={() => setShowLevelSelector(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Level Complete Dialog */}
      <LevelCompleteDialog
        isOpen={showLevelComplete}
        levelTitle={currentScenario.title}
        commandCount={levelCompleteData.commandCount}
        stars={levelCompleteData.stars}
        onNextLevel={handleNextLevel}
        onRetry={handleRetry}
        onLevelSelect={() => {
          setShowLevelComplete(false);
          setShowLevelSelector(true);
        }}
        hasNextLevel={
          scenarios.findIndex(s => s.id === currentScenario.id) < scenarios.length - 1
        }
      />
    </div>
  );
};

export default Index;
