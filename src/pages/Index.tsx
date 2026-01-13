import { useState, useEffect, useCallback } from 'react';
import { List, Keyboard, HelpCircle, Code2, Play, Pause, SkipForward, Square, FastForward, Upload, Download, Settings, Sun, Moon, Monitor, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import WorldView from '@/components/WorldView';
import ProgramPanel from '@/components/ProgramPanel';
import CommandPanel from '@/components/CommandPanel';
import WorldEditor from '@/components/WorldEditor';
import ExerciseSelector from '@/components/ExerciseSelector';
import ExerciseCompleteDialog from '@/components/ExerciseCompleteDialog';
import Tutorial from '@/components/Tutorial';
import RepeatPatternDialog from '@/components/RepeatPatternDialog';
import FSMEditor from '@/components/FSMEditor';
import CodeEditor from '@/components/CodeEditor';
import SideBySideView from '@/components/SideBySideView';
import ExecutionControlPanel from '@/components/ExecutionControlPanel';
import { moveForward, turnLeft, turnRight, pickClover, placeClover } from '@/models/world';
import { World, CellType, Position } from '@/models/types';
import { CommandType, repeatLastCommands } from '@/models/program';
import {
  FSMProgram,
  createEmptyFSM,
  downloadFSMAsKaraX,
  parseFSMContent,
  isValidFSMProgram,
} from '@/models/fsm';
import { executeFSMStep, validateFSMProgram, findMatchingTransition } from '@/models/fsmExecutor';
import { Scenario, saveProgress } from '@/models/scenario';
import { scenarios, getScenarioById } from '@/models/scenarios';
import {
  downloadWorldAsKaraX,
  downloadProgram,
  getTemplateByName,
  createEmptyTemplate,
  validateWorldData,
} from '@/models/worldTemplates';
import {
  TextKaraLanguage,
  downloadTextKaraCode,
  getAcceptString,
  saveCode,
  loadCode,
} from '@/models/textKara';
import {
  validateTextKaraCode,
  executeSingleCommand,
  createStreamingInterpreter,
  getNextStreamingCommand,
  syncStreamingInterpreterWorld,
  StreamingInterpreterState,
} from '@/models/textKaraExecutor';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useScreenReader } from '@/hooks/useScreenReader';
import { useSettings, GridColorTheme, ViewMode } from '@/hooks/useSettings';
import { useZoomPan } from '@/hooks/useZoomPan';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Index = () => {
  const { announce } = useScreenReader();
  const {
    themeMode,
    gridColorTheme,
    viewMode,
    setThemeMode,
    setGridColorTheme,
    setViewMode,
  } = useSettings();
  const [currentScenario, setCurrentScenario] = useState<Scenario>(scenarios[0]);

  // Zoom constants
  const CELL_SIZE = 56; // w-14 = 56px
  const BASELINE_GRID_SIZE = 9; // 100% zoom shows a 9x9 section
  const GRID_PADDING = 64; // Padding around the grid

  // Use undo/redo for world state management - start with 9x9 blank world
  const {
    state: world,
    setState: setWorld,
    undo: undoWorld,
    redo: redoWorld,
    canUndo: canUndoWorld,
    canRedo: canRedoWorld,
    clearHistory: clearWorldHistory,
  } = useUndoRedo<World>(createEmptyTemplate(9, 9));

  const [program, setProgram] = useState<CommandType[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [executionSpeed, setExecutionSpeed] = useState(500);
  const [selectedObject, setSelectedObject] = useState<CellType | null | 'KARA' | undefined>(undefined);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showExerciseComplete, setShowExerciseComplete] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showRepeatDialog, setShowRepeatDialog] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isTemplateMode, setIsTemplateMode] = useState(true);
  const [activeTab, setActiveTab] = useState<'map' | 'program' | 'side-by-side'>('map');
  const [pendingWidth, setPendingWidth] = useState(9);
  const [pendingHeight, setPendingHeight] = useState(9);
  const [isResizingMap, setIsResizingMap] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  // Use zoom/pan hook for map navigation
  const {
    zoom,
    fitZoom,
    setZoom,
    panOffset,
    setPanOffset,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
    getZoomPercentage,
    isAtFitZoom,
    handleZoomFit,
    handleZoom100,
  } = useZoomPan({
    worldWidth: world.width,
    worldHeight: world.height,
    cellSize: CELL_SIZE,
    baselineGridSize: BASELINE_GRID_SIZE,
    gridPadding: GRID_PADDING,
  });
  const [exerciseCompleteData, setExerciseCompleteData] = useState<{
    stars: number;
    commandCount: number;
  }>({ stars: 0, commandCount: 0 });
  const [programmingLanguage, setProgrammingLanguage] = useState<string>('Kara');
  const [fsmProgram, setFsmProgram] = useState<FSMProgram>(createEmptyFSM());
  const [fsmCurrentState, setFsmCurrentState] = useState<string | null>(null);
  const [fsmCurrentTransition, setFsmCurrentTransition] = useState<string | null>(null);
  const [fsmPreviousState, setFsmPreviousState] = useState<string | null>(null); // Track where we came from for arrow highlighting
  const [fsmPhase, setFsmPhase] = useState<'idle' | 'on-state' | 'showing-arrow'>('idle'); // Execution phase for highlighting
  const [isFsmRunning, setIsFsmRunning] = useState(false);
  const [fsmStepTrigger, setFsmStepTrigger] = useState(0); // Counter to trigger re-execution
  const [fsmStepCount, setFsmStepCount] = useState(0); // Step counter for DoS protection
  const FSM_MAX_STEPS = 10000; // Maximum FSM steps before auto-stop

  // Text-based Kara code states (one for each language)
  const [javaKaraCode, setJavaKaraCode] = useState<string>(() => loadCode('JavaKara'));
  const [pythonKaraCode, setPythonKaraCode] = useState<string>(() => loadCode('PythonKara'));
  const [jsKaraCode, setJsKaraCode] = useState<string>(() => loadCode('JavaScriptKara'));
  const [rubyKaraCode, setRubyKaraCode] = useState<string>(() => loadCode('RubyKara'));

  // Text-based code execution state (streaming interpreter for infinite loop support)
  const [textKaraInterpreter, setTextKaraInterpreter] = useState<StreamingInterpreterState | null>(null);
  const [isTextKaraRunning, setIsTextKaraRunning] = useState(false);
  const [textKaraStepCount, setTextKaraStepCount] = useState(0); // Trigger for useEffect

  // Tutorial is now only shown when user opens it from the information menu
  // (removed auto-show on first visit)

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
      clearWorldHistory(); // Clear undo/redo history when loading a new exercise
      setProgram([]);
      setCurrentStep(-1);
      setIsRunning(false);
      setShowExerciseComplete(false);
      setIsTemplateMode(false); // Loading a scenario, not a template
      setSelectedObject(null); // Clear any selected object when loading an exercise
      toast.success(`Exercise loaded: ${scenario.title}`);
      announce(`Exercise loaded: ${scenario.title}`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setWorld and other setters are stable from useState
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

      setExerciseCompleteData({ stars, commandCount });
      setShowExerciseComplete(true);

      // Confetti effect via toast
      toast.success('🎉 Exercise Complete!', {
        description: `Solved in ${commandCount} commands!`,
      });
      announce(
        `Exercise complete! Solved in ${commandCount} commands with ${stars} stars`,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setWorld is stable from useState
  }, []);

  const handleRun = () => {
    // Check if we're in FSM mode
    if (programmingLanguage === 'Kara') {
      const validation = validateFSMProgram(fsmProgram);
      if (!validation.valid) {
        toast.error(validation.error || 'FSM program is not valid');
        announce(`Cannot run: ${validation.error}`, 'assertive');
        return;
      }
      setIsFsmRunning(true);
      setFsmCurrentState(fsmProgram.startStateId);
      setFsmStepTrigger(0); // Reset trigger counter for new run
      setFsmStepCount(0); // Reset step counter for DoS protection
      toast.success('FSM program started!');
      announce('FSM program started');
      return;
    }

    // Check if we're in text-based language mode
    if (['JavaKara', 'PythonKara', 'JavaScriptKara', 'RubyKara'].includes(programmingLanguage)) {
      const lang = programmingLanguage as TextKaraLanguage;
      const code = lang === 'JavaKara' ? javaKaraCode :
                   lang === 'PythonKara' ? pythonKaraCode :
                   lang === 'JavaScriptKara' ? jsKaraCode :
                   rubyKaraCode;

      // Validate the code first
      const validation = validateTextKaraCode(code, lang);
      if (!validation.valid) {
        toast.error(validation.error || 'Code is not valid');
        announce(`Cannot run: ${validation.error}`, 'assertive');
        return;
      }

      // Create a streaming interpreter for step-by-step execution
      // This allows infinite loops to run without blocking
      const result = createStreamingInterpreter(code, lang, world);

      if (result.error || !result.interpreter) {
        toast.error(result.error || 'Failed to create interpreter');
        announce(`Error: ${result.error}`, 'assertive');
        return;
      }

      // Start step-by-step execution
      setTextKaraInterpreter(result.interpreter);
      setTextKaraStepCount(0);
      setIsTextKaraRunning(true);
      toast.success('Code started!');
      announce('Code started');
      return;
    }

    // Regular command-based program
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
    setIsFsmRunning(false);
    setIsTextKaraRunning(false);
    toast.info('Program paused');
    announce('Program paused');
  };

  const handleStep = () => {
    // === FSM (Kara) Mode ===
    if (programmingLanguage === 'Kara') {
      // Validate FSM program first
      const validation = validateFSMProgram(fsmProgram);
      if (!validation.valid) {
        toast.error(validation.error || 'FSM program is not valid');
        announce(`Cannot step: ${validation.error}`, 'assertive');
        return;
      }

      // If idle but we have a valid start state, the highlighting should already be set up
      // by the useEffect. Just execute from the current state (which should be the start state).
      // This handles the case where highlighting was set up but not yet executed.

      // Phase 2: If on-state, execute the transition, show arrow for 500ms, then advance to next state
      if (fsmPhase === 'on-state' && fsmCurrentState) {
        // Execute one FSM step from current state
        const result = executeFSMStep(world, fsmProgram, fsmCurrentState);

        if (result.error) {
          toast.error(result.error);
          announce(result.error, 'assertive');
          setFsmCurrentState(null);
          setFsmCurrentTransition(null);
          setFsmPreviousState(null);
          setFsmPhase('idle');
          return;
        }

        // Update world with execution results
        setWorld(result.world);

        if (result.stopped) {
          toast.success('FSM program completed!');
          announce('FSM program completed');
          setFsmCurrentState(null);
          setFsmCurrentTransition(null);
          setFsmPreviousState(null);
          setFsmPhase('idle');
          return;
        }

        // Show arrow phase: highlight the transition arrow and "Next State" dropdown
        setFsmPreviousState(fsmCurrentState);
        setFsmCurrentTransition(result.matchingTransitionId || null);
        setFsmCurrentState(result.nextStateId);
        setFsmPhase('showing-arrow');

        const nextStateName = fsmProgram.states.find(s => s.id === result.nextStateId)?.name || result.nextStateId;
        announce(`Transitioning to: ${nextStateName}`);

        // After 500ms, automatically advance to the next state's on-state phase
        setTimeout(() => {
          // Find the matching transition in the new state (use result.world which has the updated state)
          const matchingTransitionId = findMatchingTransition(result.world, fsmProgram, result.nextStateId);
          setFsmPreviousState(result.nextStateId);
          setFsmCurrentTransition(matchingTransitionId);
          setFsmPhase('on-state');

          const stateName = fsmProgram.states.find(s => s.id === result.nextStateId)?.name || result.nextStateId;
          announce(`Entered state: ${stateName}`);
        }, 500);

        return;
      }

      // If showing-arrow phase, ignore step presses (auto-transition handles it)
      if (fsmPhase === 'showing-arrow') {
        return;
      }

      return;
    }

    // === Text-based Language Modes ===
    if (['JavaKara', 'PythonKara', 'JavaScriptKara', 'RubyKara'].includes(programmingLanguage)) {
      const lang = programmingLanguage as TextKaraLanguage;
      const code = lang === 'JavaKara' ? javaKaraCode :
                   lang === 'PythonKara' ? pythonKaraCode :
                   lang === 'JavaScriptKara' ? jsKaraCode :
                   rubyKaraCode;

      // Validate the code first
      const validation = validateTextKaraCode(code, lang);
      if (!validation.valid) {
        toast.error(validation.error || 'Code is not valid');
        announce(`Cannot step: ${validation.error}`, 'assertive');
        return;
      }

      // Create interpreter if not exists
      let interpreter = textKaraInterpreter;
      if (!interpreter) {
        const result = createStreamingInterpreter(code, lang, world);
        if (result.error || !result.interpreter) {
          toast.error(result.error || 'Failed to create interpreter');
          announce(`Error: ${result.error}`, 'assertive');
          return;
        }
        interpreter = result.interpreter;
        setTextKaraInterpreter(interpreter);
      }

      // Sync interpreter with actual world state
      syncStreamingInterpreterWorld(interpreter, world);

      // Get next command
      const nextCmd = getNextStreamingCommand(interpreter);

      if (nextCmd.error) {
        toast.error(nextCmd.error);
        announce(nextCmd.error, 'assertive');
        setTextKaraInterpreter(null);
        return;
      }

      if (nextCmd.done || !nextCmd.command) {
        toast.success('Program completed!');
        announce('Program completed');
        setTextKaraInterpreter(null);
        return;
      }

      // Execute the command
      const execResult = executeSingleCommand(nextCmd.command, world);

      if (execResult.error) {
        toast.error(execResult.error);
        announce(execResult.error, 'assertive');
        setTextKaraInterpreter(null);
        return;
      }

      setWorld(execResult.world);
      announce(`Executed: ${nextCmd.command}`);
      return;
    }

    // === ScratchKara (Block Programming) Mode ===
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
    // In scenario mode, only allow commands specified by the exercise
    if (!isTemplateMode && !currentScenario.allowedCommands.includes(command)) {
      toast.error('This command is not allowed in this exercise!');
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

  // isDragPaint: true when drag-painting (just place, don't toggle), false on initial click (toggle)
  const handleCellClick = (position: Position, isDragPaint: boolean = false) => {
    setWorld((prevWorld) => {
      const isKaraPosition =
        position.x === prevWorld.character.position.x &&
        position.y === prevWorld.character.position.y;

      // Handle Kara placement/removal
      if (selectedObject === 'KARA') {
        // If clicking on Kara with Kara selected, remove her (only on initial click, not drag)
        if (isKaraPosition && !isDragPaint) {
          toast.success('Kara removed from world!');
          return {
            ...prevWorld,
            character: {
              ...prevWorld.character,
              position: { x: -1, y: -1 }, // Off-map position
            },
          };
        }
        // If dragging over Kara's position, skip
        if (isKaraPosition && isDragPaint) {
          return prevWorld;
        }
        // Otherwise, move Kara to new position
        if (!isDragPaint) {
          toast.success('Kara moved to new position!');
        }
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

        // If erasing on Kara's position, remove her too (only on initial click)
        if (isKaraPosition && !isDragPaint) {
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
      if (isKaraPosition) {
        if (!isDragPaint) {
          toast.error('Cannot place object on character!');
        }
        return prevWorld;
      }

      const currentCell = newGrid[position.y][position.x];

      // On initial click: toggle (place if empty/different, remove if same)
      // On drag paint: only place if cell is empty or different (don't remove same elements)
      if (isDragPaint) {
        // During drag: only place if cell doesn't already have the selected object
        if (currentCell.type !== selectedObject) {
          newGrid[position.y][position.x] = { type: selectedObject };
        }
      } else {
        // Initial click: toggle behavior
        if (currentCell.type === selectedObject) {
          newGrid[position.y][position.x] = { type: CellType.Empty };
        } else {
          newGrid[position.y][position.x] = { type: selectedObject };
        }
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

  // Clear a cell (used during drag/drop to clear source cell)
  const handleCellClear = (position: Position) => {
    setWorld((prevWorld) => {
      const isKaraPosition =
        position.x === prevWorld.character.position.x &&
        position.y === prevWorld.character.position.y;

      // If clearing Kara's position, move her off-map
      if (isKaraPosition) {
        return {
          ...prevWorld,
          character: {
            ...prevWorld.character,
            position: { x: -1, y: -1 },
          },
        };
      }

      // Clear the cell
      const newGrid = prevWorld.grid.map((row) => [...row]);
      newGrid[position.y][position.x] = { type: CellType.Empty };
      return { ...prevWorld, grid: newGrid };
    });
  };

  const handleReset = () => {
    setIsFsmRunning(false);
    setFsmCurrentState(null);
    setFsmCurrentTransition(null);
    setFsmPreviousState(null);
    setFsmPhase('idle');
    loadScenario(currentScenario.id);
  };

  const handleNextExercise = () => {
    const currentIndex = scenarios.findIndex((s) => s.id === currentScenario.id);
    if (currentIndex < scenarios.length - 1) {
      loadScenario(scenarios[currentIndex + 1].id);
    }
  };

  const handleRetry = () => {
    setShowExerciseComplete(false);
    handleReset();
  };

  const handleClearWorld = () => {
    setWorld((prevWorld) => {
      const newGrid = prevWorld.grid.map((row) => row.map(() => ({ type: CellType.Empty })));
      return { ...prevWorld, grid: newGrid };
    });
  };

  const handleExportWorld = () => {
    downloadWorldAsKaraX(world, `kara-world-${currentScenario.id}.world`);
    toast.success('World exported successfully!');
  };

  const _handleExportProgram = () => {
    downloadProgram(program, `kara-program-${currentScenario.id}.json`);
    toast.success('Program exported successfully!');
  };

  const handleImportWorld = (importedWorld: unknown) => {
    const validation = validateWorldData(importedWorld);
    if (validation.valid && validation.world) {
      setWorld(validation.world);
      setIsTemplateMode(true); // Imported worlds are in template mode - all commands allowed
      setProgram([]);
      setCurrentStep(-1);
      setIsRunning(false);
      toast.success('World imported successfully!');
    } else {
      toast.error(validation.error || 'Invalid world file!');
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

  // Initialize FSM highlighting when in Kara mode with a valid start state
  // This sets up the start state as highlighted (on-state) so it's ready to execute
  useEffect(() => {
    if (programmingLanguage !== 'Kara') return;
    if (!fsmProgram.startStateId) return;
    if (isFsmRunning) return; // Don't interfere with auto-run
    if (fsmPhase !== 'idle') return; // Already initialized

    // Validate the FSM program
    const validation = validateFSMProgram(fsmProgram);
    if (!validation.valid) return;

    // Set up the start state as highlighted (ready to execute on first step)
    const matchingTransitionId = findMatchingTransition(world, fsmProgram, fsmProgram.startStateId);
    setFsmCurrentState(fsmProgram.startStateId);
    setFsmPreviousState(null);
    setFsmCurrentTransition(matchingTransitionId);
    setFsmPhase('on-state');
  }, [programmingLanguage, fsmProgram.startStateId, fsmProgram, isFsmRunning, fsmPhase, world]);

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

  // FSM Auto-execution
  useEffect(() => {
    if (!isFsmRunning) return;

    // Initialize on first run
    const currentState = fsmCurrentState || fsmProgram.startStateId;
    if (!currentState) return;

    // Check for max step limit (DoS protection)
    if (fsmStepCount >= FSM_MAX_STEPS) {
      setIsFsmRunning(false);
      setFsmCurrentState(null);
      setFsmCurrentTransition(null);
      setFsmPreviousState(null);
      setFsmPhase('idle');
      setFsmStepCount(0);
      toast.error(`Execution limit exceeded (${FSM_MAX_STEPS} steps). Possible infinite loop.`);
      announce(`FSM error: Execution limit exceeded. Possible infinite loop.`, 'assertive');
      return;
    }

    // Execute one FSM step
    const result = executeFSMStep(world, fsmProgram, currentState);

    // Update the world, step count, and transition
    setWorld(result.world);
    setFsmStepCount(prev => prev + 1);
    setFsmPreviousState(currentState);
    setFsmCurrentTransition(result.matchingTransitionId || null);

    // Check if we hit an error
    if (result.error) {
      setIsFsmRunning(false);
      setFsmCurrentState(null);
      setFsmCurrentTransition(null);
      setFsmPreviousState(null);
      setFsmPhase('idle');
      setFsmStepCount(0);
      toast.error(result.error);
      announce(`FSM error: ${result.error}`, 'assertive');
      return;
    }

    // Check if we've stopped
    if (result.stopped) {
      setIsFsmRunning(false);
      setFsmCurrentState(null);
      setFsmCurrentTransition(null);
      setFsmPreviousState(null);
      setFsmPhase('idle');
      setFsmStepCount(0);
      toast.success('FSM program completed!');
      announce('FSM program completed');
      return;
    }

    // Animate: show arrow briefly, then move to next state
    setFsmPhase('showing-arrow');
    setFsmCurrentState(result.nextStateId);

    const timer = setTimeout(() => {
      setFsmPhase('on-state');
      setFsmStepTrigger(prev => prev + 1); // Trigger next execution
    }, Math.min(executionSpeed / 2, 200)); // Brief arrow display

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFsmRunning, fsmStepTrigger, executionSpeed, fsmStepCount]);

  // Text-based code auto-execution (streaming interpreter)
  useEffect(() => {
    if (!isTextKaraRunning || !textKaraInterpreter) return;

    // Get the next command from the streaming interpreter
    const commandResult = getNextStreamingCommand(textKaraInterpreter);

    // Check if we hit an error during command generation
    if (commandResult.error) {
      setIsTextKaraRunning(false);
      setTextKaraInterpreter(null);
      toast.error(commandResult.error);
      announce(`Execution error: ${commandResult.error}`, 'assertive');
      return;
    }

    // Check if program is done
    if (commandResult.done || !commandResult.command) {
      setIsTextKaraRunning(false);
      setTextKaraInterpreter(null);
      toast.success('Code executed successfully!');
      announce('Code executed successfully');
      return;
    }

    // Execute the command
    const result = executeSingleCommand(commandResult.command, world);

    // Update the world
    setWorld(result.world);

    // Check if we hit an error during command execution
    if (result.error) {
      setIsTextKaraRunning(false);
      setTextKaraInterpreter(null);
      toast.error(result.error);
      announce(`Execution error: ${result.error}`, 'assertive');
      return;
    }

    // Schedule the next step
    const timer = setTimeout(() => {
      setTextKaraStepCount(prev => prev + 1);
    }, executionSpeed);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTextKaraRunning, textKaraInterpreter, textKaraStepCount, executionSpeed]);

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
                onClick={() => setShowExerciseSelector(true)}
                className="gap-2"
                aria-label="Select exercise to play"
              >
                <List className="h-4 w-4" />
                Exercises
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

              {/* Info Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInfoDialog(true)}
                aria-label="Show information"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>

              {/* Settings Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" aria-label="Settings">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* Theme Mode */}
                  <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      {themeMode === 'light' ? (
                        <Sun className="mr-2 h-4 w-4" />
                      ) : themeMode === 'dark' ? (
                        <Moon className="mr-2 h-4 w-4" />
                      ) : (
                        <Monitor className="mr-2 h-4 w-4" />
                      )}
                      <span>Theme</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={themeMode} onValueChange={(v) => setThemeMode(v as 'light' | 'dark' | 'system')}>
                        <DropdownMenuRadioItem value="light">
                          <Sun className="mr-2 h-4 w-4" />
                          Light
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="dark">
                          <Moon className="mr-2 h-4 w-4" />
                          Dark
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="system">
                          <Monitor className="mr-2 h-4 w-4" />
                          System
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  {/* Grid Color Theme */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <span
                        className={`mr-2 h-4 w-4 rounded border ${
                          gridColorTheme === 'green' ? 'bg-green-400' :
                          gridColorTheme === 'blue' ? 'bg-sky-400' :
                          gridColorTheme === 'white' ? 'bg-gray-100' :
                          'bg-gray-700'
                        }`}
                      />
                      <span>Grid Color</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={gridColorTheme} onValueChange={(v) => setGridColorTheme(v as GridColorTheme)}>
                        <DropdownMenuRadioItem value="green">
                          <span className="mr-2 h-4 w-4 rounded bg-green-400 border" />
                          Green
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="blue">
                          <span className="mr-2 h-4 w-4 rounded bg-sky-400 border" />
                          Baby Blue
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="white">
                          <span className="mr-2 h-4 w-4 rounded bg-gray-100 border" />
                          White
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="dark">
                          <span className="mr-2 h-4 w-4 rounded bg-gray-700 border" />
                          Dark
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {/* View Mode */}
                  <DropdownMenuLabel>View</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                    <DropdownMenuRadioItem value="normal">
                      <Eye className="mr-2 h-4 w-4" />
                      Normal View
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="transparency">
                      <EyeOff className="mr-2 h-4 w-4" />
                      Kara's Vision
                      <span className="ml-auto text-xs text-muted-foreground">
                        Invisible items fade
                      </span>
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="container mx-auto px-6 py-6" role="main">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'map' | 'program' | 'side-by-side')} className="h-[calc(100vh-140px)]">
          <TabsList className="mb-4">
            <TabsTrigger value="map">World</TabsTrigger>
            <TabsTrigger value="program">Program</TabsTrigger>
            <TabsTrigger value="side-by-side">Side-by-Side</TabsTrigger>
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

                {/* World Size Controls */}
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <span className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-xs">
                      📐
                    </span>
                    World Size
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
                        className="w-full px-2 py-1 text-sm border rounded disabled:opacity-50 bg-background text-foreground border-input caret-black dark:caret-white"
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
                        className="w-full px-2 py-1 text-sm border rounded disabled:opacity-50 bg-background text-foreground border-input caret-black dark:caret-white"
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
                            toast.success(`World resized to ${pendingWidth}x${pendingHeight}`);
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
                      Current: {isAtFitZoom ? 'Fit' : `${getZoomPercentage()}%`}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={handleZoom100}
                        size="sm"
                        variant="outline"
                        className="gap-1"
                      >
                        100%
                      </Button>
                      <Button
                        onClick={handleZoomFit}
                        size="sm"
                        variant="outline"
                        className="gap-1"
                      >
                        Fit
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Execution Speed - shown in sandbox mode (left panel) */}
                {isTemplateMode && (
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" id="speed-label-left">
                      <span className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-xs">
                        ⚡
                      </span>
                      Execution Speed
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Slow</span>
                      <Slider
                        value={[1000 - executionSpeed]}
                        onValueChange={(value) => setExecutionSpeed(1000 - value[0])}
                        min={200}
                        max={900}
                        step={100}
                        className="flex-1"
                        aria-labelledby="speed-label-left"
                      />
                      <span className="text-xs text-muted-foreground">Fast</span>
                    </div>
                  </Card>
                )}
              </aside>

              {/* Center - World View */}
              <div
                className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700 overflow-hidden relative"
                role="region"
                aria-label="World view"
                onWheel={(e) => {
                  // Always zoom when scrolling over the map grid
                  e.preventDefault();
                  const delta = e.deltaY;

                  // Get the mouse position relative to the container
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mouseX = e.clientX - rect.left;
                  const mouseY = e.clientY - rect.top;

                  // Calculate the position relative to the center
                  const centerX = rect.width / 2;
                  const centerY = rect.height / 2;
                  const offsetX = mouseX - centerX;
                  const offsetY = mouseY - centerY;

                  setZoom((prev) => {
                    const newZoom = prev * (delta > 0 ? 0.9 : 1.1);
                    // Use fitZoom as minimum to prevent zooming out past fit level
                    const clampedZoom = Math.max(fitZoom, Math.min(5, newZoom));

                    // Adjust pan offset to zoom towards cursor
                    const zoomFactor = clampedZoom / prev;
                    setPanOffset((prevOffset) => ({
                      x: prevOffset.x - (offsetX * (zoomFactor - 1)) / prev,
                      y: prevOffset.y - (offsetY * (zoomFactor - 1)) / prev,
                    }));

                    return clampedZoom;
                  });
                }}
                onMouseDown={(e) => {
                  // Enable panning in exercise mode, or in template mode when no tool is selected
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
                    onCellClear={isTemplateMode ? handleCellClear : undefined}
                    selectedObject={isTemplateMode ? selectedObject : undefined}
                    gridColorTheme={gridColorTheme}
                    viewMode={viewMode}
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
                    onSaveTemplate={(_name) => toast.info('Save template feature coming soon!')}
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
                      onClick={isRunning || isFsmRunning || isTextKaraRunning ? handlePause : handleRun}
                      disabled={
                        programmingLanguage === 'Kara' ? !fsmProgram.startStateId :
                        ['JavaKara', 'PythonKara', 'JavaScriptKara', 'RubyKara'].includes(programmingLanguage) ? (
                          (programmingLanguage === 'JavaKara' && !javaKaraCode.trim()) ||
                          (programmingLanguage === 'PythonKara' && !pythonKaraCode.trim()) ||
                          (programmingLanguage === 'JavaScriptKara' && !jsKaraCode.trim()) ||
                          (programmingLanguage === 'RubyKara' && !rubyKaraCode.trim())
                        ) :
                        program.length === 0
                      }
                      size="sm"
                      variant={isRunning || isFsmRunning || isTextKaraRunning ? 'destructive' : 'default'}
                      className="gap-1"
                      aria-label={isRunning || isFsmRunning || isTextKaraRunning ? 'Pause program execution' : 'Run program'}
                    >
                      {isRunning || isFsmRunning || isTextKaraRunning ? (
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
                      disabled={
                        isRunning || isFsmRunning || isTextKaraRunning ||
                        (programmingLanguage === 'ScratchKara' && program.length === 0) ||
                        (programmingLanguage === 'Kara' && (!fsmProgram.startStateId || fsmPhase === 'showing-arrow')) ||
                        (['JavaKara', 'PythonKara', 'JavaScriptKara', 'RubyKara'].includes(programmingLanguage) &&
                          ((programmingLanguage === 'JavaKara' && !javaKaraCode.trim()) ||
                           (programmingLanguage === 'PythonKara' && !pythonKaraCode.trim()) ||
                           (programmingLanguage === 'JavaScriptKara' && !jsKaraCode.trim()) ||
                           (programmingLanguage === 'RubyKara' && !rubyKaraCode.trim())))
                      }
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
                        setIsFsmRunning(false);
                        setFsmCurrentState(null);
                        setFsmCurrentTransition(null);
                        setFsmPreviousState(null);
                        setFsmPhase('idle');
                        setIsTextKaraRunning(false);
                        setTextKaraInterpreter(null);
                        toast.info('Execution ended');
                      }}
                      disabled={currentStep === -1 && !isRunning && !isFsmRunning && !isTextKaraRunning && fsmPhase === 'idle'}
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
                      disabled={programmingLanguage === 'Kara' || ['JavaKara', 'PythonKara', 'JavaScriptKara', 'RubyKara'].includes(programmingLanguage) || program.length === 0 || currentStep >= program.length - 1}
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

                {/* Execution Speed - shown in exercise mode (right panel) */}
                {!isTemplateMode && (
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" id="speed-label-right">
                      <span className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-xs">
                        ⚡
                      </span>
                      Execution Speed
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Slow</span>
                      <Slider
                        value={[1000 - executionSpeed]}
                        onValueChange={(value) => setExecutionSpeed(1000 - value[0])}
                        min={200}
                        max={900}
                        step={100}
                        className="flex-1"
                        aria-labelledby="speed-label-right"
                      />
                      <span className="text-xs text-muted-foreground">Fast</span>
                    </div>
                  </Card>
                )}
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="program" className="h-[calc(100%-60px)] mt-0">
            <div className="flex h-full gap-4">
              {/* Main Programming Area */}
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Top Panels */}
                <div className="flex justify-end gap-4 px-4 pt-4">
                {/* File Operations Panel */}
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        // Accept appropriate files based on language
                        if (programmingLanguage === 'Kara') {
                          input.accept = '.kara,.json';
                        } else if (['JavaKara', 'PythonKara', 'JavaScriptKara', 'RubyKara'].includes(programmingLanguage)) {
                          input.accept = getAcceptString(programmingLanguage as TextKaraLanguage);
                        } else {
                          input.accept = '.json,.txt';
                        }
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const content = event.target?.result as string;
                              if (programmingLanguage === 'Kara') {
                                // Parse FSM program from .kara or JSON
                                const importedProgram = parseFSMContent(content);
                                if (isValidFSMProgram(importedProgram)) {
                                  setFsmProgram(importedProgram);
                                  toast.success('FSM program uploaded successfully!');
                                } else {
                                  toast.error('Invalid FSM program file!');
                                }
                              } else if (['JavaKara', 'PythonKara', 'JavaScriptKara', 'RubyKara'].includes(programmingLanguage)) {
                                // Load text-based code
                                const lang = programmingLanguage as TextKaraLanguage;
                                if (lang === 'JavaKara') {
                                  setJavaKaraCode(content);
                                  saveCode('JavaKara', content);
                                } else if (lang === 'PythonKara') {
                                  setPythonKaraCode(content);
                                  saveCode('PythonKara', content);
                                } else if (lang === 'JavaScriptKara') {
                                  setJsKaraCode(content);
                                  saveCode('JavaScriptKara', content);
                                } else if (lang === 'RubyKara') {
                                  setRubyKaraCode(content);
                                  saveCode('RubyKara', content);
                                }
                                toast.success('Code uploaded successfully!');
                              } else {
                                toast.success('Program uploaded successfully!');
                              }
                            } catch {
                              toast.error('Failed to upload program. Invalid file format.');
                            }
                          };
                          reader.readAsText(file);
                        };
                        input.click();
                      }}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (programmingLanguage === 'Kara') {
                          // Export FSM program as .kara file
                          downloadFSMAsKaraX(fsmProgram, 'kara-fsm-program.kara');
                          toast.success('FSM program downloaded!');
                        } else if (['JavaKara', 'PythonKara', 'JavaScriptKara', 'RubyKara'].includes(programmingLanguage)) {
                          // Export text-based code
                          const lang = programmingLanguage as TextKaraLanguage;
                          const code = lang === 'JavaKara' ? javaKaraCode :
                                       lang === 'PythonKara' ? pythonKaraCode :
                                       lang === 'JavaScriptKara' ? jsKaraCode :
                                       rubyKaraCode;
                          downloadTextKaraCode(code, lang);
                          toast.success('Code downloaded!');
                        } else {
                          // Export regular program as JSON
                          const programData = JSON.stringify(program, null, 2);
                          const blob = new Blob([programData], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `kara-program-${programmingLanguage.toLowerCase()}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success('Program downloaded!');
                        }
                      }}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </Card>

                {/* Programming Language Selector */}
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Language:</span>
                    <Select value={programmingLanguage} onValueChange={setProgrammingLanguage}>
                      <SelectTrigger className="w-[180px] h-9">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kara">Kara</SelectItem>
                        <SelectItem value="JavaKara">JavaKara</SelectItem>
                        <SelectItem value="PythonKara">PythonKara</SelectItem>
                        <SelectItem value="JavaScriptKara">JavaScriptKara</SelectItem>
                        <SelectItem value="RubyKara">RubyKara</SelectItem>
                        <SelectItem value="ScratchKara">ScratchKara</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              </div>

              {/* Program Builder - Centered */}
              <div className="flex-1 flex items-center justify-center overflow-auto px-4 pb-4">
                {programmingLanguage === 'Kara' ? (
                  <div
                    aria-label="FSM programming editor"
                    className="w-full h-full max-w-6xl animate-in fade-in slide-in-from-bottom duration-500"
                  >
                    <FSMEditor
                      program={fsmProgram}
                      onUpdateProgram={setFsmProgram}
                      currentExecutingStateId={fsmCurrentState}
                      currentExecutingTransitionId={fsmCurrentTransition}
                      previousStateId={fsmPreviousState}
                      executionPhase={fsmPhase}
                      isExecuting={isFsmRunning || fsmPhase !== 'idle'}
                    />
                  </div>
                ) : ['JavaKara', 'PythonKara', 'JavaScriptKara', 'RubyKara'].includes(programmingLanguage) ? (
                  <div
                    aria-label={`${programmingLanguage} code editor`}
                    className="w-full h-full max-w-6xl animate-in fade-in slide-in-from-bottom duration-500 flex flex-col gap-2"
                  >
                    {['PythonKara', 'JavaScriptKara', 'RubyKara'].includes(programmingLanguage) && (
                      <Alert className="py-2 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                        <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                          {programmingLanguage} is still in development. You may encounter errors while using this feature.
                        </AlertDescription>
                      </Alert>
                    )}
                    <CodeEditor
                      code={
                        programmingLanguage === 'JavaKara' ? javaKaraCode :
                        programmingLanguage === 'PythonKara' ? pythonKaraCode :
                        programmingLanguage === 'JavaScriptKara' ? jsKaraCode :
                        rubyKaraCode
                      }
                      language={programmingLanguage as TextKaraLanguage}
                      onChange={(newCode) => {
                        if (programmingLanguage === 'JavaKara') {
                          setJavaKaraCode(newCode);
                          saveCode('JavaKara', newCode);
                        } else if (programmingLanguage === 'PythonKara') {
                          setPythonKaraCode(newCode);
                          saveCode('PythonKara', newCode);
                        } else if (programmingLanguage === 'JavaScriptKara') {
                          setJsKaraCode(newCode);
                          saveCode('JavaScriptKara', newCode);
                        } else if (programmingLanguage === 'RubyKara') {
                          setRubyKaraCode(newCode);
                          saveCode('RubyKara', newCode);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div
                    aria-label="Program builder panel"
                    className="w-full max-w-md animate-in fade-in slide-in-from-bottom duration-500 flex flex-col gap-2"
                  >
                    {programmingLanguage === 'ScratchKara' && (
                      <Alert className="py-2 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                        <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                          ScratchKara is still in development. You may encounter errors while using this feature.
                        </AlertDescription>
                      </Alert>
                    )}
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
                  </div>
                )}
              </div>
              </div>

              {/* Right Sidebar - Execution Controls */}
              <aside className="w-72 flex-shrink-0 p-4 border-l border-border overflow-y-auto flex flex-col gap-4">
                <ExecutionControlPanel
                  isRunning={isRunning || isFsmRunning || isTextKaraRunning}
                  executionSpeed={executionSpeed}
                  onExecutionSpeedChange={setExecutionSpeed}
                  onRun={handleRun}
                  onPause={handlePause}
                  onStep={handleStep}
                  onEnd={() => {
                    setCurrentStep(-1);
                    setIsRunning(false);
                    setIsFsmRunning(false);
                    setFsmCurrentState(null);
                    setFsmCurrentTransition(null);
                    setFsmPreviousState(null);
                    setFsmPhase('idle');
                    setIsTextKaraRunning(false);
                    setTextKaraInterpreter(null);
                    toast.info('Execution ended');
                  }}
                  onSkip={programmingLanguage === 'ScratchKara' ? () => {
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
                  } : undefined}
                  canRun={
                    programmingLanguage === 'Kara' ? !!fsmProgram.startStateId :
                    ['JavaKara', 'PythonKara', 'JavaScriptKara', 'RubyKara'].includes(programmingLanguage) ? (
                      (programmingLanguage === 'JavaKara' && !!javaKaraCode.trim()) ||
                      (programmingLanguage === 'PythonKara' && !!pythonKaraCode.trim()) ||
                      (programmingLanguage === 'JavaScriptKara' && !!jsKaraCode.trim()) ||
                      (programmingLanguage === 'RubyKara' && !!rubyKaraCode.trim())
                    ) :
                    program.length > 0
                  }
                  canStep={
                    !(isRunning || isFsmRunning || isTextKaraRunning) && (
                      (programmingLanguage === 'Kara' && !!fsmProgram.startStateId && fsmPhase !== 'showing-arrow') ||
                      (['JavaKara', 'PythonKara', 'JavaScriptKara', 'RubyKara'].includes(programmingLanguage) && (
                        (programmingLanguage === 'JavaKara' && !!javaKaraCode.trim()) ||
                        (programmingLanguage === 'PythonKara' && !!pythonKaraCode.trim()) ||
                        (programmingLanguage === 'JavaScriptKara' && !!jsKaraCode.trim()) ||
                        (programmingLanguage === 'RubyKara' && !!rubyKaraCode.trim())
                      )) ||
                      (programmingLanguage === 'ScratchKara' && program.length > 0)
                    )
                  }
                  canEnd={currentStep !== -1 || isRunning || isFsmRunning || isTextKaraRunning}
                  canSkip={
                    programmingLanguage === 'ScratchKara' &&
                    program.length > 0 &&
                    currentStep < program.length - 1
                  }
                />

                {/* World Preview (scaled down view of entire world) */}
                <Card className="p-3">
                  <h3 className="text-sm font-semibold mb-2">World Preview</h3>
                  <div
                    className="bg-muted/20 rounded-lg border-2 border-border overflow-hidden flex items-center justify-center"
                    style={{ height: '200px' }}
                  >
                    <div style={{ transform: 'scale(0.35)', transformOrigin: 'center' }}>
                      <WorldView
                        world={world}
                        gridColorTheme={gridColorTheme}
                        viewMode={viewMode}
                      />
                    </div>
                  </div>
                </Card>
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="side-by-side" className="h-[calc(100%-60px)] mt-0">
            <SideBySideView
              world={world}
              gridColorTheme={gridColorTheme}
              viewMode={viewMode}
              isRunning={isRunning}
              isFsmRunning={isFsmRunning}
              isTextKaraRunning={isTextKaraRunning}
              executionSpeed={executionSpeed}
              onExecutionSpeedChange={setExecutionSpeed}
              onRun={handleRun}
              onPause={handlePause}
              onStep={handleStep}
              onEnd={() => {
                setCurrentStep(-1);
                setIsRunning(false);
                setIsFsmRunning(false);
                setFsmCurrentState(null);
                setFsmCurrentTransition(null);
                setFsmPreviousState(null);
                setFsmPhase('idle');
                setIsTextKaraRunning(false);
                setTextKaraInterpreter(null);
                toast.info('Execution ended');
              }}
              onSkip={() => {
                if (programmingLanguage === 'ScratchKara' && program.length > 0) {
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
                }
              }}
              programmingLanguage={programmingLanguage}
              fsmProgram={fsmProgram}
              fsmCurrentState={fsmCurrentState}
              fsmPreviousState={fsmPreviousState}
              fsmCurrentTransition={fsmCurrentTransition}
              fsmPhase={fsmPhase}
              program={program}
              currentStep={currentStep}
              textKaraCode={
                programmingLanguage === 'JavaKara' ? javaKaraCode :
                programmingLanguage === 'PythonKara' ? pythonKaraCode :
                programmingLanguage === 'JavaScriptKara' ? jsKaraCode :
                programmingLanguage === 'RubyKara' ? rubyKaraCode : ''
              }
              canRun={
                programmingLanguage === 'Kara' ? !!fsmProgram.startStateId :
                ['JavaKara', 'PythonKara', 'JavaScriptKara', 'RubyKara'].includes(programmingLanguage) ? (
                  (programmingLanguage === 'JavaKara' && !!javaKaraCode.trim()) ||
                  (programmingLanguage === 'PythonKara' && !!pythonKaraCode.trim()) ||
                  (programmingLanguage === 'JavaScriptKara' && !!jsKaraCode.trim()) ||
                  (programmingLanguage === 'RubyKara' && !!rubyKaraCode.trim())
                ) :
                program.length > 0
              }
              canStep={
                !isRunning && !isFsmRunning && !isTextKaraRunning && (
                  (programmingLanguage === 'Kara' && !!fsmProgram.startStateId && fsmPhase !== 'showing-arrow') ||
                  (['JavaKara', 'PythonKara', 'JavaScriptKara', 'RubyKara'].includes(programmingLanguage) && (
                    (programmingLanguage === 'JavaKara' && !!javaKaraCode.trim()) ||
                    (programmingLanguage === 'PythonKara' && !!pythonKaraCode.trim()) ||
                    (programmingLanguage === 'JavaScriptKara' && !!jsKaraCode.trim()) ||
                    (programmingLanguage === 'RubyKara' && !!rubyKaraCode.trim())
                  )) ||
                  (programmingLanguage === 'ScratchKara' && program.length > 0)
                )
              }
              canEnd={currentStep !== -1 || isRunning || isFsmRunning || isTextKaraRunning}
              canSkip={
                programmingLanguage === 'ScratchKara' &&
                program.length > 0 &&
                currentStep < program.length - 1
              }
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Exercise Selector Dialog */}
      <Dialog open={showExerciseSelector} onOpenChange={setShowExerciseSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <ExerciseSelector
            currentScenarioId={currentScenario.id}
            onSelectScenario={loadScenario}
            onClose={() => setShowExerciseSelector(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Exercise Complete Dialog */}
      <ExerciseCompleteDialog
        isOpen={showExerciseComplete}
        exerciseTitle={currentScenario.title}
        commandCount={exerciseCompleteData.commandCount}
        stars={exerciseCompleteData.stars}
        onNextExercise={handleNextExercise}
        onRetry={handleRetry}
        onExerciseSelect={() => {
          setShowExerciseComplete(false);
          setShowExerciseSelector(true);
        }}
        hasNextExercise={
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

            {/* Exercise/Template Info */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">
                {isTemplateMode ? 'Template Info' : 'Exercise Info'}
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

            {/* Tutorial Button */}
            <Button
              onClick={() => {
                setShowInfoDialog(false);
                setShowTutorial(true);
              }}
              className="w-full gap-2"
              size="lg"
            >
              <HelpCircle className="h-4 w-4" />
              Open Tutorial
            </Button>
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
