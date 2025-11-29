import { useState, useEffect, useCallback } from 'react';
import { List, Keyboard, HelpCircle, Code2, Play, Pause, SkipForward, Square, FastForward } from 'lucide-react';
import WorldView from '@/components/WorldView';
import ProgramPanel from '@/components/ProgramPanel';
import CommandPanel from '@/components/CommandPanel';
import WorldEditor from '@/components/WorldEditor';
import LevelSelector from '@/components/LevelSelector';
import LevelCompleteDialog from '@/components/LevelCompleteDialog';
import Tutorial from '@/components/Tutorial';
import RepeatPatternDialog from '@/components/RepeatPatternDialog';
import { moveForward, turnLeft, turnRight, pickClover, placeClover } from '@/models/world';
import { World, CellType, Position } from '@/models/types';
import { CommandType, repeatLastCommands } from '@/models/program';
import { Scenario, saveProgress } from '@/models/scenario';
import { scenarios, getScenarioById } from '@/models/scenarios';
import {
  downloadWorld,
  downloadProgram,
  getTemplateByName,
  isValidWorld,
} from '@/models/worldTemplates';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useScreenReader } from '@/hooks/useScreenReader';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

const Index = () => {
  const { announce } = useScreenReader();
  const [currentScenario, setCurrentScenario] = useState<Scenario>(scenarios[0]);

  // Zoom baseline: 1.68 scale = 100% for 5x5 grid
  const BASELINE_ZOOM = 1.68;
  const BASELINE_GRID_SIZE = 5;

  // Use undo/redo for world state management
  const {
    state: world,
    setState: setWorld,
    undo: undoWorld,
    redo: redoWorld,
    canUndo: canUndoWorld,
    canRedo: canRedoWorld,
    clearHistory: clearWorldHistory,
  } = useUndoRedo<World>(scenarios[0].world);

  const [program, setProgram] = useState<CommandType[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [executionSpeed, setExecutionSpeed] = useState(500);
  const [selectedObject, setSelectedObject] = useState<CellType | null | 'KARA' | undefined>(undefined);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showRepeatDialog, setShowRepeatDialog] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isTemplateMode, setIsTemplateMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'program'>('map');
  const [zoom, setZoom] = useState(BASELINE_ZOOM);
  const [pendingWidth, setPendingWidth] = useState(5);
  const [pendingHeight, setPendingHeight] = useState(5);
  const [isResizingMap, setIsResizingMap] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [levelCompleteData, setLevelCompleteData] = useState<{
    stars: number;
    commandCount: number;
  }>({ stars: 0, commandCount: 0 });

  // Check if this is the user's first visit
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('kara-tutorial-completed');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  // Prevent browser zoom with Ctrl/Cmd + wheel to allow only our custom zoom
  useEffect(() => {
    const preventBrowserZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    // Add passive: false to allow preventDefault
    document.addEventListener('wheel', preventBrowserZoom, { passive: false });

    return () => {
      document.removeEventListener('wheel', preventBrowserZoom);
    };
  }, []);

  // Sync pending dimensions with actual world dimensions
  useEffect(() => {
    setPendingWidth(world.width);
    setPendingHeight(world.height);
  }, [world.width, world.height]);

  const loadScenario = useCallback(
    (scenarioId: string) => {
      const scenario = getScenarioById(scenarioId);
      if (!scenario) return;

      setCurrentScenario(scenario);
      setWorld(JSON.parse(JSON.stringify(scenario.world))); // Deep copy
      clearWorldHistory(); // Clear undo/redo history when loading a new level
      setProgram([]);
      setCurrentStep(-1);
      setIsRunning(false);
      setShowLevelComplete(false);
      setIsTemplateMode(false); // Loading a scenario, not a template
      setSelectedObject(null); // Clear any selected object when loading a level
      toast.success(`Level loaded: ${scenario.title}`);
      announce(`Level loaded: ${scenario.title}`);
    },
    [clearWorldHistory, announce]
  );

  const checkGoalCondition = useCallback(() => {
    // Only check goal conditions in scenario mode, not template mode
    if (isTemplateMode) return;

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
      announce(
        `Level complete! Solved in ${commandCount} commands with ${stars} stars`,
        'assertive'
      );
    }
  }, [world, currentScenario, program.length, isTemplateMode, announce]);

  const executeCommand = useCallback((command: CommandType) => {
    setWorld((prevWorld) => {
      let newWorld = prevWorld;

      switch (command) {
        case CommandType.MoveForward:
          newWorld = moveForward(prevWorld);
          if (newWorld === prevWorld) {
            toast.error('Cannot move forward - blocked!');
          } else {
            // Check if a mushroom was pushed
            const targetPos = {
              x:
                prevWorld.character.position.x +
                (prevWorld.character.direction === 'EAST'
                  ? 1
                  : prevWorld.character.direction === 'WEST'
                    ? -1
                    : 0),
              y:
                prevWorld.character.position.y +
                (prevWorld.character.direction === 'SOUTH'
                  ? 1
                  : prevWorld.character.direction === 'NORTH'
                    ? -1
                    : 0),
            };

            if (
              targetPos.x >= 0 &&
              targetPos.x < prevWorld.width &&
              targetPos.y >= 0 &&
              targetPos.y < prevWorld.height &&
              prevWorld.grid[targetPos.y][targetPos.x].type === 'MUSHROOM'
            ) {
              toast.success('Pushed mushroom! 🍄');
            }
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
  }, []);

  const handleRun = () => {
    if (program.length === 0) {
      toast.error('Program is empty!');
      announce('Cannot run: Program is empty', 'assertive');
      return;
    }
    setIsRunning(true);
    setCurrentStep(0);
    toast.success('Program started!');
    announce(`Program started with ${program.length} commands`);
  };

  const handlePause = () => {
    setIsRunning(false);
    toast.info('Program paused');
    announce('Program paused');
  };

  const handleStep = () => {
    if (program.length === 0) return;

    const nextStep = currentStep === -1 ? 0 : currentStep + 1;

    if (nextStep >= program.length) {
      setCurrentStep(-1);
      toast.success('Program completed!');
      announce('Program completed');
      return;
    }

    setCurrentStep(nextStep);
    setIsRunning(false); // Make sure we're not in running mode for step
    executeCommand(program[nextStep]);
    announce(`Executing step ${nextStep + 1} of ${program.length}`);
  };

  const handleAddCommand = (command: CommandType) => {
    // In template mode, allow all commands
    // In scenario mode, only allow commands specified by the level
    if (!isTemplateMode && !currentScenario.allowedCommands.includes(command)) {
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
    setWorld((prevWorld) => {
      const isKaraPosition =
        position.x === prevWorld.character.position.x &&
        position.y === prevWorld.character.position.y;

      // Handle Kara placement/removal
      if (selectedObject === 'KARA') {
        // If clicking on Kara with Kara selected, remove her
        if (isKaraPosition) {
          toast.success('Kara removed from world!');
          return {
            ...prevWorld,
            character: {
              ...prevWorld.character,
              position: { x: -1, y: -1 }, // Off-map position
            },
          };
        }
        // Otherwise, move Kara to new position
        toast.success('Kara moved to new position!');
        return {
          ...prevWorld,
          character: {
            ...prevWorld.character,
            position: position,
          },
        };
      }

      // Handle eraser (null selectedObject)
      if (selectedObject === null) {
        const newGrid = prevWorld.grid.map((row) => [...row]);
        newGrid[position.y][position.x] = { type: CellType.Empty };

        // If erasing on Kara's position, remove her too
        if (isKaraPosition) {
          toast.success('Kara removed from world!');
          return {
            ...prevWorld,
            grid: newGrid,
            character: {
              ...prevWorld.character,
              position: { x: -1, y: -1 }, // Off-map position
            },
          };
        }

        return { ...prevWorld, grid: newGrid };
      }

      // Handle regular object placement
      const newGrid = prevWorld.grid.map((row) => [...row]);

      // Don't place on character position
      if (
        position.x === prevWorld.character.position.x &&
        position.y === prevWorld.character.position.y
      ) {
        toast.error('Cannot place object on character!');
        return prevWorld;
      }

      // Toggle: if the cell already has the same element, remove it
      const currentCell = newGrid[position.y][position.x];
      if (currentCell.type === selectedObject) {
        newGrid[position.y][position.x] = { type: CellType.Empty };
      } else {
        newGrid[position.y][position.x] = { type: selectedObject };
      }

      return { ...prevWorld, grid: newGrid };
    });
  };

  const handleCellDrop = (position: Position, cellType: CellType | 'KARA') => {
    setWorld((prevWorld) => {
      const isKaraPosition =
        position.x === prevWorld.character.position.x &&
        position.y === prevWorld.character.position.y;

      // Handle Kara placement/removal
      if (cellType === 'KARA') {
        // If dropping on Kara with Kara, remove her
        if (isKaraPosition) {
          toast.success('Kara removed from world!');
          return {
            ...prevWorld,
            character: {
              ...prevWorld.character,
              position: { x: -1, y: -1 }, // Off-map position
            },
          };
        }
        // Otherwise, move Kara to new position
        toast.success('Kara moved to new position!');
        return {
          ...prevWorld,
          character: {
            ...prevWorld.character,
            position: position,
          },
        };
      }

      const newGrid = prevWorld.grid.map((row) => [...row]);

      // Don't place on character position
      if (
        position.x === prevWorld.character.position.x &&
        position.y === prevWorld.character.position.y
      ) {
        toast.error('Cannot place object on character!');
        return prevWorld;
      }

      // Toggle: if the cell already has the same element, remove it
      const currentCell = newGrid[position.y][position.x];
      if (currentCell.type === cellType) {
        newGrid[position.y][position.x] = { type: CellType.Empty };
      } else {
        newGrid[position.y][position.x] = { type: cellType };
      }

      return { ...prevWorld, grid: newGrid };
    });
  };

  const handleReset = () => {
    loadScenario(currentScenario.id);
  };

  const handleNextLevel = () => {
    const currentIndex = scenarios.findIndex((s) => s.id === currentScenario.id);
    if (currentIndex < scenarios.length - 1) {
      loadScenario(scenarios[currentIndex + 1].id);
    }
  };

  const handleRetry = () => {
    setShowLevelComplete(false);
    handleReset();
  };

  const handleClearWorld = () => {
    setWorld((prevWorld) => {
      const newGrid = prevWorld.grid.map((row) => row.map(() => ({ type: CellType.Empty })));
      return { ...prevWorld, grid: newGrid };
    });
  };

  const handleExportWorld = () => {
    downloadWorld(world, `kara-world-${currentScenario.id}.json`);
    toast.success('World exported successfully!');
  };

  const handleExportProgram = () => {
    downloadProgram(program, `kara-program-${currentScenario.id}.json`);
    toast.success('Program exported successfully!');
  };

  const handleImportWorld = (importedWorld: World) => {
    if (isValidWorld(importedWorld)) {
      setWorld(importedWorld);
      setIsTemplateMode(true); // Imported worlds are in template mode - all commands allowed
      setProgram([]);
      setCurrentStep(-1);
      setIsRunning(false);
      toast.success('World imported successfully!');
    } else {
      toast.error('Invalid world file!');
    }
  };

  const handleLoadTemplate = (templateName: string) => {
    const template = getTemplateByName(templateName);
    setWorld(template);
    clearWorldHistory(); // Clear undo/redo history when loading a template
    setIsTemplateMode(true); // Enable template mode - all commands allowed
    setProgram([]); // Clear program when switching to template
    setCurrentStep(-1);
    setIsRunning(false);
    toast.success(`Template loaded: ${templateName}`);
  };

  const handleTutorialComplete = () => {
    localStorage.setItem('kara-tutorial-completed', 'true');
    toast.success('Tutorial completed! Ready to start coding!');
  };

  const handleRepeatPattern = (commandCount: number, times: number) => {
    const newProgram = repeatLastCommands(program, commandCount, times);
    setProgram(newProgram);
    toast.success(`Repeated last ${commandCount} command(s) ${times} time(s)!`);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onRun: () => {
      if (isRunning) {
        handlePause();
      } else {
        handleRun();
      }
    },
    onPause: handlePause,
    onStep: handleStep,
    onReset: handleReset,
    onClear: handleClearProgram,
    onSave: handleExportWorld,
    onRepeat: () => {
      if (program.length > 0) {
        setShowRepeatDialog(true);
      }
    },
    onUndo: () => {
      if (canUndoWorld) {
        undoWorld();
        toast.info('Undo');
        announce('Undid last action');
      }
    },
    onRedo: () => {
      if (canRedoWorld) {
        redoWorld();
        toast.info('Redo');
        announce('Redid action');
      }
    },
  });

  // Check goal whenever world changes (both during run and step mode)
  useEffect(() => {
    if (!isTemplateMode && program.length > 0) {
      checkGoalCondition();
    }
  }, [world, isTemplateMode, program.length, checkGoalCondition]);

  // Auto-execution when running
  useEffect(() => {
    if (!isRunning || currentStep === -1) return;

    // Execute the current command
    executeCommand(program[currentStep]);

    // Schedule the next step
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, currentStep, program, executionSpeed]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-accent focus:text-accent-foreground focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between" aria-label="Main navigation">
            <div className="flex items-center gap-3">
              <img
                src="/favicon.svg"
                alt="Kara the Ladybug"
                className="h-9 w-9"
                aria-hidden="true"
              />
              <h1 className="text-lg font-bold">Kara the Ladybug</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTutorial(true)}
                className="gap-2"
                aria-label="Open tutorial and help"
              >
                <HelpCircle className="h-4 w-4" />
                Help
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLevelSelector(true)}
                className="gap-2"
                aria-label="Select level to play"
              >
                <List className="h-4 w-4" />
                Levels
              </Button>
              <Button
                variant={isTemplateMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowTemplateSelector(true)}
                className="gap-2"
                aria-label="Switch to sandbox mode"
                aria-pressed={isTemplateMode}
              >
                <Code2 className="h-4 w-4" />
                Sandbox
              </Button>
              <div className="text-right">
                <div className="text-xs text-muted-foreground" id="speed-label">
                  Execution Speed
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">Slow</span>
                  <Slider
                    value={[1000 - executionSpeed]}
                    onValueChange={(value) => setExecutionSpeed(1000 - value[0])}
                    min={200}
                    max={900}
                    step={100}
                    className="w-32"
                    aria-labelledby="speed-label"
                    aria-valuemin={200}
                    aria-valuemax={900}
                    aria-valuenow={1000 - executionSpeed}
                  />
                  <span className="text-xs">Fast</span>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="container mx-auto px-6 py-6" role="main">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'map' | 'program')} className="h-[calc(100vh-140px)]">
          <TabsList className="mb-4">
            <TabsTrigger value="map">Map</TabsTrigger>
            <TabsTrigger value="program">Program</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="h-[calc(100%-60px)] mt-0">
            <div className="grid grid-cols-[280px,1fr,280px] gap-6 h-full">
              {/* Left Panel - Commands */}
              <aside
                aria-label="Commands panel"
                className="animate-in fade-in slide-in-from-left duration-500 overflow-y-auto"
              >
                {!isTemplateMode && (
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
                )}
                <CommandPanel
                  onExecuteCommand={executeCommand}
                />

                {/* Map Size Controls */}
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <span className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-xs">
                      📐
                    </span>
                    Map Size
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Width
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={pendingWidth}
                        onChange={(e) => {
                          const newWidth = Math.max(1, Math.min(100, parseInt(e.target.value) || 1));
                          setPendingWidth(newWidth);
                        }}
                        disabled={isResizingMap}
                        className="w-full px-2 py-1 text-sm border rounded disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Height
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={pendingHeight}
                        onChange={(e) => {
                          const newHeight = Math.max(1, Math.min(100, parseInt(e.target.value) || 1));
                          setPendingHeight(newHeight);
                        }}
                        disabled={isResizingMap}
                        className="w-full px-2 py-1 text-sm border rounded disabled:opacity-50"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        setIsResizingMap(true);
                        // Use setTimeout to allow the loading state to render before heavy computation
                        setTimeout(() => {
                          setWorld((prev) => {
                            const newGrid = Array(pendingHeight)
                              .fill(null)
                              .map((_, y) =>
                                Array(pendingWidth)
                                  .fill(null)
                                  .map((_, x) =>
                                    x < prev.width && y < prev.height
                                      ? prev.grid[y][x]
                                      : { type: CellType.Empty }
                                  )
                              );
                            return { ...prev, width: pendingWidth, height: pendingHeight, grid: newGrid };
                          });
                          // Small delay to ensure smooth rendering
                          setTimeout(() => {
                            setIsResizingMap(false);
                            toast.success(`Map resized to ${pendingWidth}x${pendingHeight}`);
                          }, 100);
                        }, 50);
                      }}
                      disabled={isResizingMap || (pendingWidth === world.width && pendingHeight === world.height)}
                      size="sm"
                      className="w-full gap-2"
                    >
                      {isResizingMap ? (
                        <>
                          <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Change'
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Zoom Controls */}
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <span className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-xs">
                      🔍
                    </span>
                    Zoom
                  </h3>
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground mb-2">
                      Current: {Math.round((zoom / BASELINE_ZOOM) * 100)}%
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => setZoom(BASELINE_ZOOM)}
                        size="sm"
                        variant="outline"
                        className="gap-1"
                      >
                        100%
                      </Button>
                      <Button
                        onClick={() => {
                          // Calculate zoom to fit entire grid, relative to 5x5 baseline
                          const container = document.querySelector('[role="region"][aria-label="World view"]');
                          if (container) {
                            const containerWidth = container.clientWidth;
                            const containerHeight = container.clientHeight;
                            const cellSize = 56; // Actual cell size (w-14 = 56px)
                            const padding = 64; // Account for grid padding and card padding

                            // Calculate what zoom would be needed to fit this grid
                            const gridWidth = world.width * cellSize + padding;
                            const gridHeight = world.height * cellSize + padding;
                            const zoomX = containerWidth / gridWidth;
                            const zoomY = containerHeight / gridHeight;
                            const fitZoom = Math.min(zoomX, zoomY) * 0.95; // 95% to add small padding

                            // For a 5x5 grid, fitZoom should equal BASELINE_ZOOM (100%)
                            // For larger grids, fitZoom will be proportionally smaller
                            setZoom(fitZoom);
                          }
                        }}
                        size="sm"
                        variant="outline"
                        className="gap-1"
                      >
                        Fit
                      </Button>
                    </div>
                  </div>
                </Card>
              </aside>

              {/* Center - World View */}
              <div
                className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700 overflow-auto relative"
                role="region"
                aria-label="World view"
                onWheel={(e) => {
                  // Always zoom when scrolling over the map grid
                  e.preventDefault();
                  const delta = e.deltaY;
                  setZoom((prev) => {
                    const newZoom = prev * (delta > 0 ? 0.9 : 1.1);
                    return Math.max(0.1, Math.min(5, newZoom));
                  });
                }}
                onMouseDown={(e) => {
                  // Enable panning in level mode, or in template mode when no tool is selected
                  if (!isTemplateMode || selectedObject === undefined) {
                    setIsPanning(true);
                    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
                  }
                }}
                onMouseMove={(e) => {
                  if (isPanning) {
                    setPanOffset({
                      x: e.clientX - panStart.x,
                      y: e.clientY - panStart.y,
                    });
                  }
                }}
                onMouseUp={() => {
                  setIsPanning(false);
                }}
                onMouseLeave={() => {
                  setIsPanning(false);
                }}
                style={{
                  cursor: isResizingMap ? 'wait' : isPanning ? 'grabbing' : (!isTemplateMode || selectedObject === undefined ? 'grab' : 'default'),
                }}
              >
                {isResizingMap && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-medium">Resizing map...</p>
                    </div>
                  </div>
                )}
                <div style={{
                  transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                  transformOrigin: 'center',
                  transition: isPanning ? 'none' : 'transform 0.1s',
                  willChange: isPanning ? 'transform' : 'auto',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}>
                  <WorldView
                    world={world}
                    onCellClick={isTemplateMode ? handleCellClick : undefined}
                    onCellDrop={isTemplateMode ? handleCellDrop : undefined}
                    selectedObject={isTemplateMode ? selectedObject : undefined}
                  />
                </div>
              </div>

              {/* Right Panel - Status, World Editor & Execute Program */}
              <aside
                aria-label="Right panel"
                className="space-y-4 animate-in fade-in slide-in-from-right duration-500 overflow-y-auto"
              >
                {/* Kara Status Panel */}
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <span className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-xs">
                      📍
                    </span>
                    Kara Status
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Position:</span>
                      <span className="font-medium">({world.character.position.x}, {world.character.position.y})</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Facing:</span>
                      <span className="font-medium">{world.character.direction}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Inventory:</span>
                      <span className="font-medium text-accent">🍀 {world.character.inventory}</span>
                    </div>
                  </div>
                </Card>

                {isTemplateMode && (
                  <WorldEditor
                    onSelectObject={setSelectedObject}
                    selectedObject={selectedObject}
                    onClearWorld={handleClearWorld}
                    onExportWorld={handleExportWorld}
                    onImportWorld={handleImportWorld}
                    onSaveTemplate={(name) => toast.info('Save template feature coming soon!')}
                    onLoadTemplate={handleLoadTemplate}
                  />
                )}

                {/* Execute Program Panel */}
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3" id="execution-heading">
                    Execute Program
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mb-2" role="group" aria-labelledby="execution-heading">
                    <Button
                      onClick={isRunning ? handlePause : handleRun}
                      disabled={program.length === 0}
                      size="sm"
                      variant={isRunning ? 'destructive' : 'default'}
                      className="gap-1"
                      aria-label={isRunning ? 'Pause program execution' : 'Run program'}
                    >
                      {isRunning ? (
                        <>
                          <Pause className="h-3 w-3" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" />
                          Run
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleStep}
                      disabled={program.length === 0 || isRunning}
                      size="sm"
                      variant="secondary"
                      className="gap-1"
                      aria-label="Execute next command"
                    >
                      <SkipForward className="h-3 w-3" />
                      Step
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => {
                        setCurrentStep(-1);
                        setIsRunning(false);
                        toast.info('Execution ended');
                      }}
                      disabled={currentStep === -1 && !isRunning}
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      aria-label="End program execution"
                    >
                      <Square className="h-3 w-3" />
                      End
                    </Button>
                    <Button
                      onClick={() => {
                        if (program.length === 0) return;
                        setIsRunning(false);
                        let tempWorld = world;
                        for (let i = currentStep + 1; i < program.length; i++) {
                          const cmd = program[i];
                          switch (cmd) {
                            case CommandType.MoveForward:
                              tempWorld = moveForward(tempWorld);
                              break;
                            case CommandType.TurnLeft:
                              tempWorld = turnLeft(tempWorld);
                              break;
                            case CommandType.TurnRight:
                              tempWorld = turnRight(tempWorld);
                              break;
                            case CommandType.PickClover:
                              tempWorld = pickClover(tempWorld);
                              break;
                            case CommandType.PlaceClover:
                              tempWorld = placeClover(tempWorld);
                              break;
                          }
                        }
                        setWorld(tempWorld);
                        setCurrentStep(-1);
                        toast.success('Skipped to end');
                      }}
                      disabled={program.length === 0 || currentStep >= program.length - 1}
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      aria-label="Skip to end of program"
                    >
                      <FastForward className="h-3 w-3" />
                      Skip
                    </Button>
                  </div>
                </Card>

                {/* Info Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInfoDialog(true)}
                  className="w-full gap-2"
                  aria-label="Show information"
                >
                  <HelpCircle className="h-4 w-4" />
                  Information
                </Button>
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="program" className="h-[calc(100%-60px)] mt-0">
            <div className="grid grid-cols-[280px,1fr] gap-6 h-full">
              {/* Left Panel - Program Builder */}
              <aside
                aria-label="Program builder panel"
                className="animate-in fade-in slide-in-from-left duration-500"
              >
                <ProgramPanel
                  program={program}
                  currentStep={currentStep}
                  isRunning={isRunning}
                  onAddCommand={handleAddCommand}
                  onRemoveCommand={handleRemoveCommand}
                  onClearProgram={handleClearProgram}
                  onRun={handleRun}
                  onPause={handlePause}
                  onStep={handleStep}
                  onRepeatPattern={() => setShowRepeatDialog(true)}
                />
              </aside>

              {/* Right - World View */}
              <div
                className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700 overflow-auto relative"
                role="region"
                aria-label="World view"
                onWheel={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    const delta = e.deltaY;
                    setZoom((prev) => {
                      const newZoom = prev * (delta > 0 ? 0.9 : 1.1);
                      return Math.max(0.1, Math.min(5, newZoom));
                    });
                  }
                }}
                onMouseDown={(e) => {
                  setIsPanning(true);
                  setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
                }}
                onMouseMove={(e) => {
                  if (isPanning) {
                    setPanOffset({
                      x: e.clientX - panStart.x,
                      y: e.clientY - panStart.y,
                    });
                  }
                }}
                onMouseUp={() => {
                  setIsPanning(false);
                }}
                onMouseLeave={() => {
                  setIsPanning(false);
                }}
                style={{
                  cursor: isResizingMap ? 'wait' : isPanning ? 'grabbing' : 'grab',
                }}
              >
                {isResizingMap && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-medium">Resizing map...</p>
                    </div>
                  </div>
                )}
                <div style={{
                  transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                  transformOrigin: 'center',
                  transition: isPanning ? 'none' : 'transform 0.1s',
                  willChange: isPanning ? 'transform' : 'auto',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}>
                  <WorldView world={world} />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
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
          scenarios.findIndex((s) => s.id === currentScenario.id) < scenarios.length - 1
        }
      />

      {/* Tutorial */}
      <Tutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={handleTutorialComplete}
      />

      {/* Repeat Pattern Dialog */}
      <RepeatPatternDialog
        isOpen={showRepeatDialog}
        onClose={() => setShowRepeatDialog(false)}
        onRepeat={handleRepeatPattern}
        maxCommands={program.length}
      />

      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Information</h2>

            {/* Level/Template Info */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">
                {isTemplateMode ? 'Template Info' : 'Level Info'}
              </h3>
              <div className="space-y-2 text-xs">
                {isTemplateMode ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mode:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        Free Play
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Commands:</span>
                      <span className="font-medium">All Available</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Difficulty:</span>
                      <span className="font-medium capitalize">{currentScenario.difficulty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Commands:</span>
                      <span className="font-medium">{currentScenario.allowedCommands.length}</span>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Quick Guide */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Quick Guide</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>• Click commands to execute instantly</p>
                <p>• Use Program tab to build sequences</p>
                <p>• Complete the goal to win!</p>
              </div>
            </Card>

            {/* Keyboard Shortcuts */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Keyboard Shortcuts
              </h3>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Reset</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">R</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Undo</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+Z</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Redo</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+Y</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Export World</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+S</kbd>
                </div>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Selector Dialog */}
      <Dialog open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
        <DialogContent>
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Sandbox Mode</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a template to start building your own world
              </p>
            </div>
            <div className="grid gap-3">
              {[
                { name: 'Empty Grid', description: 'Start fresh with an empty grid' },
                { name: 'Maze', description: 'A simple maze with trees' },
                { name: 'Garden', description: 'A garden filled with clovers' },
                { name: 'Obstacle Course', description: 'Trees and mushrooms to navigate' },
              ].map((template) => (
                <Button
                  key={template.name}
                  variant="outline"
                  className="justify-start h-auto p-4 hover:bg-accent"
                  onClick={() => {
                    handleLoadTemplate(template.name);
                    setShowTemplateSelector(false);
                  }}
                >
                  <div className="text-left">
                    <div className="font-semibold">{template.name}</div>
                    <div className="text-xs text-muted-foreground">{template.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
