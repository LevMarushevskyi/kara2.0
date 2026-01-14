import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FSMProgram,
  FSMState,
  DetectorType,
} from '@/models/fsm';
import { Plus, Play, Trash2, Bug, ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { PickCloverIcon, PlaceCloverIcon } from '@/components/CloverActionIcons';

// Detector icon component - shows Kara with detected object in relative position
// Uses the same visual elements as WorldView for consistency
const DetectorIcon = ({
  type,
  size = 40
}: {
  type: 'treeFront' | 'treeLeft' | 'treeRight' | 'mushroomFront' | 'onLeaf';
  size?: number;
}) => {
  // Calculate sizes based on icon size
  const bugSize = size * 0.4;
  const emojiSize = size * 0.45;
  const questionSize = size * 0.25;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {type === 'treeFront' && (
        <>
          {/* 2x2 grid: tree on top, Kara on bottom */}
          <div className="absolute inset-0 grid grid-cols-1 grid-rows-2 items-center justify-items-center">
            <span style={{ fontSize: emojiSize }}>🪾</span>
            <Bug className="text-red-500" size={bugSize} />
          </div>
          <span
            className="absolute text-muted-foreground font-bold"
            style={{ fontSize: questionSize, top: 2, right: 2 }}
          >
            ?
          </span>
        </>
      )}

      {type === 'treeLeft' && (
        <>
          {/* 2 columns: tree on left, Kara on right */}
          <div className="absolute inset-0 grid grid-cols-2 items-center justify-items-center">
            <span style={{ fontSize: emojiSize }}>🪾</span>
            <Bug className="text-red-500" size={bugSize} />
          </div>
          <span
            className="absolute text-muted-foreground font-bold"
            style={{ fontSize: questionSize, top: 2, right: 2 }}
          >
            ?
          </span>
        </>
      )}

      {type === 'treeRight' && (
        <>
          {/* 2 columns: Kara on left, tree on right */}
          <div className="absolute inset-0 grid grid-cols-2 items-center justify-items-center">
            <Bug className="text-red-500" size={bugSize} />
            <span style={{ fontSize: emojiSize }}>🪾</span>
          </div>
          <span
            className="absolute text-muted-foreground font-bold"
            style={{ fontSize: questionSize, top: 2, right: 2 }}
          >
            ?
          </span>
        </>
      )}

      {type === 'mushroomFront' && (
        <>
          {/* 2 rows: mushroom on top, Kara on bottom */}
          <div className="absolute inset-0 grid grid-cols-1 grid-rows-2 items-center justify-items-center">
            <span style={{ fontSize: emojiSize }}>🍄</span>
            <Bug className="text-red-500" size={bugSize} />
          </div>
          <span
            className="absolute text-muted-foreground font-bold"
            style={{ fontSize: questionSize, top: 2, right: 2 }}
          >
            ?
          </span>
        </>
      )}

      {type === 'onLeaf' && (
        <>
          {/* Kara on top of clover - same as WorldView cell rendering */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="absolute opacity-40"
              style={{ fontSize: emojiSize * 1.2 }}
            >
              🍀
            </span>
            <Bug className="text-red-500 relative z-10" size={bugSize} />
          </div>
          <span
            className="absolute text-muted-foreground font-bold"
            style={{ fontSize: questionSize, top: 2, right: 2 }}
          >
            ?
          </span>
        </>
      )}
    </div>
  );
};

// Editable tab component for inline state name editing
const EditableTab = ({
  name,
  isSelected,
  isStart,
  onSelect,
  onRename,
  onDelete,
  maxLength = 30,
}: {
  name: string;
  isSelected: boolean;
  isStart: boolean;
  onSelect: () => void;
  onRename: (newName: string) => void;
  onDelete?: () => void;
  maxLength?: number;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(name);
  }, [name]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(name);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== name) {
      onRename(trimmed);
    } else {
      setEditValue(name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setEditValue(name);
      setIsEditing(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      const confirmed = window.confirm(
        `Are you sure you want to delete the state "${name}"?\n\nTransitions pointing to this state will become self-loops.`
      );
      if (confirmed) {
        onDelete();
      }
    }
  };

  return (
    <div
      className={`
        px-3 py-1.5 text-sm font-medium rounded-t-md border-b-2 transition-colors
        flex items-center gap-1 min-w-0 max-w-[200px] group
        ${isSelected
          ? 'bg-background border-primary text-foreground'
          : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
        }
      `}
      title={name.length > 20 ? name : undefined}
    >
      <button
        onClick={onSelect}
        onDoubleClick={handleDoubleClick}
        className="flex items-center gap-1 min-w-0 flex-1"
      >
        {isStart && <span className="text-green-500 flex-shrink-0">▶</span>}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            maxLength={maxLength}
            className="w-full min-w-[60px] bg-transparent border-none outline-none text-sm p-0 caret-black dark:caret-white"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate">{name}</span>
        )}
      </button>
      {onDelete && !isEditing && (
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity p-0.5 -mr-1 flex-shrink-0"
          title="Delete state"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

// Execution phase type for FSM visualization
type FSMExecutionPhase = 'idle' | 'transition-matched' | 'executing-action' | 'showing-arrow';

interface FSMEditorProps {
  program: FSMProgram;
  onUpdateProgram: (program: FSMProgram) => void;
  // Execution highlighting props
  currentExecutingStateId?: string | null;
  currentExecutingTransitionId?: string | null;
  previousStateId?: string | null; // For arrow highlighting - where we came from
  executionPhase?: FSMExecutionPhase; // Phase controlled by parent
  currentActionIndex?: number; // Currently executing action index (-1 = none)
  isExecuting?: boolean;
}

type ActionType = 'move' | 'turnLeft' | 'turnRight' | 'pickClover' | 'placeClover';

const FSMEditor = ({
  program,
  onUpdateProgram,
  currentExecutingStateId = null,
  currentExecutingTransitionId = null,
  previousStateId: _parentPreviousStateId = null,
  executionPhase: parentExecutionPhase = 'idle',
  currentActionIndex = -1,
  isExecuting = false,
}: FSMEditorProps) => {
  const [selectedStateId, setSelectedStateId] = useState<string>(
    program.states.find((s) => s.id !== program.stopStateId)?.id || program.stopStateId
  );
  const [draggingStateId, setDraggingStateId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [diagramZoom, setDiagramZoom] = useState(1);

  // Use parent execution phase directly (no mapping needed anymore)
  const executionPhase: FSMExecutionPhase = parentExecutionPhase;

  // Determine what should be highlighted based on parent-controlled phase
  // transition-matched, executing-action: highlight the current state and transition row
  // showing-arrow: highlight the arrow from current to target state
  const isStateActive = executionPhase === 'transition-matched' || executionPhase === 'executing-action' || executionPhase === 'showing-arrow';
  const highlightedStateId = isStateActive ? currentExecutingStateId : null;
  const transitionFromState = executionPhase === 'showing-arrow' ? currentExecutingStateId : null;
  const transitionToState = executionPhase === 'showing-arrow' ? (
    // Get target state from the current transition
    (() => {
      if (!currentExecutingStateId || !currentExecutingTransitionId) return null;
      const state = program.states.find(s => s.id === currentExecutingStateId);
      const transition = state?.transitions.find(t => t.id === currentExecutingTransitionId);
      return transition?.targetStateId || null;
    })()
  ) : null;

  const editableStates = program.states.filter((s) => s.id !== program.stopStateId);

  // Calculate bounding box of all states to determine canvas size for scrolling
  const STATE_RADIUS = 48;
  const PADDING = 80;
  const bounds = useMemo(() => {
    if (program.states.length === 0) {
      return { minX: 0, minY: 0, width: 400, height: 256 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    program.states.forEach(state => {
      minX = Math.min(minX, state.x - STATE_RADIUS - PADDING);
      minY = Math.min(minY, state.y - STATE_RADIUS - PADDING);
      maxX = Math.max(maxX, state.x + STATE_RADIUS + PADDING);
      maxY = Math.max(maxY, state.y + STATE_RADIUS + PADDING);
    });

    const width = Math.max(maxX - minX, 400);
    const height = Math.max(maxY - minY, 256);

    return { minX, minY, width, height };
  }, [program.states]);

  const canvasWidth = bounds.width;
  const canvasHeight = bounds.height;

  // Helper function to find a non-overlapping position for a new state
  const findNonOverlappingPosition = (): { x: number; y: number } => {
    const stateRadius = 40; // Approximate radius of state bubble
    const minDistance = stateRadius * 2.5; // Minimum distance between state centers
    const gridStep = 100; // Step size for grid-based placement

    // Try positions in a grid pattern
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const candidateX = 150 + col * gridStep;
        const candidateY = 100 + row * gridStep;

        // Check if this position overlaps with any existing state
        const hasOverlap = program.states.some((state) => {
          const dx = state.x - candidateX;
          const dy = state.y - candidateY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance < minDistance;
        });

        if (!hasOverlap) {
          return { x: candidateX, y: candidateY };
        }
      }
    }

    // Fallback: place it offset from the last state
    const lastState = program.states[program.states.length - 1];
    if (lastState) {
      return { x: lastState.x + gridStep, y: lastState.y };
    }

    return { x: 150, y: 100 };
  };

  const handleAddState = () => {
    const newStateId = `state-${Date.now()}`;
    const position = findNonOverlappingPosition();
    const newState: FSMState = {
      id: newStateId,
      name: `State ${editableStates.length + 1}`,
      x: position.x,
      y: position.y,
      transitions: [],
    };

    onUpdateProgram({
      ...program,
      states: [...program.states, newState],
    });
    setSelectedStateId(newStateId);
  };

  const handleSetAsStart = () => {
    if (selectedStateId && selectedStateId !== program.stopStateId) {
      onUpdateProgram({
        ...program,
        startStateId: selectedStateId,
      });
    }
  };

  const handleDeleteState = () => {
    if (selectedStateId && selectedStateId !== program.stopStateId) {
      const newStates = program.states.filter((s) => s.id !== selectedStateId);
      // Redirect transitions pointing to deleted state back to their own state (self-loop)
      const updatedStates = newStates.map((state) => ({
        ...state,
        transitions: state.transitions.map((t) =>
          t.targetStateId === selectedStateId ? { ...t, targetStateId: state.id } : t
        ),
      }));

      // If we deleted the start state, clear it
      let newStartStateId = program.startStateId;
      if (program.startStateId === selectedStateId) {
        newStartStateId = null;
      }

      onUpdateProgram({
        ...program,
        states: updatedStates,
        startStateId: newStartStateId,
      });

      // Select another state
      const nextState = editableStates.find((s) => s.id !== selectedStateId);
      setSelectedStateId(nextState?.id || program.stopStateId);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, stateId: string) => {
    const state = program.states.find((s) => s.id === stateId);
    if (!state) return;

    // Get the scrollable container (the element with onMouseMove)
    const scrollContainer = e.currentTarget.closest('[data-scroll-container]') as HTMLElement;
    if (!scrollContainer) return;

    const containerRect = scrollContainer.getBoundingClientRect();

    // Calculate click position in unscaled coordinates
    const clickX = (e.clientX - containerRect.left + scrollContainer.scrollLeft) / diagramZoom;
    const clickY = (e.clientY - containerRect.top + scrollContainer.scrollTop) / diagramZoom;

    setDraggingStateId(stateId);
    setDragOffset({
      x: clickX - state.x,
      y: clickY - state.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingStateId) return;

    const container = e.currentTarget as HTMLElement;
    const containerRect = container.getBoundingClientRect();

    // Calculate mouse position in unscaled coordinates, accounting for scroll and zoom
    const mouseX = (e.clientX - containerRect.left + container.scrollLeft) / diagramZoom;
    const mouseY = (e.clientY - containerRect.top + container.scrollTop) / diagramZoom;

    let newX = Math.max(0, mouseX - dragOffset.x);
    let newY = Math.max(0, mouseY - dragOffset.y);

    const stateRadius = 48; // Bubble radius (w-20 = 80px, so radius ~40 + padding)
    const minDistance = stateRadius * 2; // Minimum distance between state centers

    // Get all other states (not the one being dragged)
    const otherStates = program.states.filter((s) => s.id !== draggingStateId);

    // Iteratively resolve collisions by moving the dragged state away from others
    // This prevents overlap instead of pushing other states
    let iterations = 0;
    const maxIterations = 10;
    let hasCollision = true;

    while (hasCollision && iterations < maxIterations) {
      hasCollision = false;
      iterations++;

      for (const other of otherStates) {
        const dx = newX - other.x;
        const dy = newY - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          hasCollision = true;
          if (distance === 0) {
            // Exactly on top, push in a default direction
            newX = other.x + minDistance;
          } else {
            // Move the dragged state away to maintain minimum distance
            const normalX = dx / distance;
            const normalY = dy / distance;
            newX = other.x + normalX * minDistance;
            newY = other.y + normalY * minDistance;
          }
          // Clamp to bounds
          newX = Math.max(0, newX);
          newY = Math.max(0, newY);
        }
      }
    }

    // Create the updated states array with only the dragged state moved
    const updatedStates = program.states.map((state) =>
      state.id === draggingStateId ? { ...state, x: newX, y: newY } : state
    );

    onUpdateProgram({
      ...program,
      states: updatedStates,
    });
  };

  const handleMouseUp = () => {
    setDraggingStateId(null);
  };

  // Get current state
  const getCurrentState = (): FSMState | undefined => {
    return program.states.find((s) => s.id === selectedStateId);
  };

  // Get current state's transitions
  const getCurrentRows = () => {
    const state = getCurrentState();
    return state?.transitions || [];
  };

  // Get active detectors for current state
  const getActiveDetectors = (): DetectorType[] => {
    const state = getCurrentState();
    return state?.activeDetectors || [];
  };

  // Update a state's transitions in the program
  const updateStateTransitions = (stateId: string, transitions: typeof program.states[0]['transitions']) => {
    onUpdateProgram({
      ...program,
      states: program.states.map((state) =>
        state.id === stateId ? { ...state, transitions } : state
      ),
    });
  };

  // Add a new transition row
  const handleAddRow = () => {
    const activeDetectors = getActiveDetectors();
    // Initialize all active detectors to true ("yes") by default
    const initialConditions: Partial<Record<DetectorType, boolean | null>> = {};
    activeDetectors.forEach((d) => {
      initialConditions[d] = true;
    });

    const newRow = {
      id: `row-${Date.now()}`,
      actions: [],
      targetStateId: selectedStateId, // Default to current state
      detectorConditions: initialConditions,
    };

    const currentRows = getCurrentRows();
    updateStateTransitions(selectedStateId, [...currentRows, newRow]);
    setSelectedRowId(newRow.id);
  };

  // Delete a row
  const handleDeleteRow = (rowId: string) => {
    const newRows = getCurrentRows().filter((r) => r.id !== rowId);
    updateStateTransitions(selectedStateId, newRows);
    if (selectedRowId === rowId) {
      setSelectedRowId(newRows.length > 0 ? newRows[0].id : null);
    }
  };

  // Toggle detector - adds or removes it from the active list
  const handleToggleDetector = (detector: DetectorType) => {
    const activeDetectors = getActiveDetectors();
    const isActive = activeDetectors.includes(detector);

    if (isActive) {
      // Remove detector from active list
      const newDetectors = activeDetectors.filter((d) => d !== detector);

      // Also remove this detector from all existing transitions
      const rows = getCurrentRows();
      const updatedRows = rows.map((row) => ({
        ...row,
        detectorConditions: Object.fromEntries(
          Object.entries(row.detectorConditions).filter(([key]) => key !== detector)
        ) as Partial<Record<DetectorType, boolean | null>>,
      }));

      // Update both activeDetectors and transitions
      onUpdateProgram({
        ...program,
        states: program.states.map((state) =>
          state.id === selectedStateId
            ? { ...state, activeDetectors: newDetectors, transitions: updatedRows }
            : state
        ),
      });
    } else {
      // Add detector to active list
      const newDetectors = [...activeDetectors, detector];

      // Add detector to all existing transitions (if any)
      const rows = getCurrentRows();
      const updatedRows = rows.length > 0
        ? rows.map((row) => ({
            ...row,
            detectorConditions: {
              ...row.detectorConditions,
              [detector]: true, // Default to "yes"
            },
          }))
        : rows;

      // Update both activeDetectors and transitions
      onUpdateProgram({
        ...program,
        states: program.states.map((state) =>
          state.id === selectedStateId
            ? { ...state, activeDetectors: newDetectors, transitions: updatedRows }
            : state
        ),
      });
    }
  };

  // Toggle detector logic gate for a specific row (cycles through: true -> false -> null -> true)
  // true = "yes" (trigger when detector is true)
  // false = "no" (trigger when detector is false)
  // null = "yes or no" (don't care, always trigger)
  const handleToggleLogicGate = (rowId: string, detector: DetectorType) => {
    const rows = getCurrentRows();
    const updatedRows = rows.map((row) => {
      if (row.id === rowId) {
        const currentState = row.detectorConditions[detector];
        // Cycle: true -> false -> null -> true
        const nextState = currentState === true ? false : currentState === false ? null : true;

        return {
          ...row,
          detectorConditions: {
            ...row.detectorConditions,
            [detector]: nextState,
          },
        };
      }
      return row;
    });

    updateStateTransitions(selectedStateId, updatedRows);
  };

  // Add action to selected row
  const handleAddActionToRow = (action: ActionType) => {
    if (!selectedRowId) return;

    const rows = getCurrentRows();
    const updatedRows = rows.map((row) => {
      if (row.id === selectedRowId) {
        return {
          ...row,
          actions: [...row.actions, { type: action }],
        };
      }
      return row;
    });

    updateStateTransitions(selectedStateId, updatedRows);
  };

  // Remove action from row
  const handleRemoveActionFromRow = (rowId: string, actionIndex: number) => {
    const rows = getCurrentRows();
    const updatedRows = rows.map((row) => {
      if (row.id === rowId) {
        return {
          ...row,
          actions: row.actions.filter((_, i) => i !== actionIndex),
        };
      }
      return row;
    });

    updateStateTransitions(selectedStateId, updatedRows);
  };

  // Update row target state
  const handleUpdateRowTarget = (rowId: string, targetStateId: string) => {
    // Handle "New State" option
    if (targetStateId === '__new_state__') {
      const newStateId = `state-${Date.now()}`;
      const position = findNonOverlappingPosition();
      const newState: FSMState = {
        id: newStateId,
        name: `State ${editableStates.length + 1}`,
        x: position.x,
        y: position.y,
        transitions: [],
      };

      // Update the row to point to the new state
      const rows = getCurrentRows();
      const updatedRows = rows.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            targetStateId: newStateId,
          };
        }
        return row;
      });

      // Update program with new state and updated transitions
      const updatedStates = program.states.map((s) => {
        if (s.id === selectedStateId) {
          return { ...s, transitions: updatedRows };
        }
        return s;
      });

      onUpdateProgram({
        ...program,
        states: [...updatedStates, newState],
      });
      return;
    }

    const rows = getCurrentRows();
    const updatedRows = rows.map((row) => {
      if (row.id === rowId) {
        return {
          ...row,
          targetStateId,
        };
      }
      return row;
    });

    updateStateTransitions(selectedStateId, updatedRows);
  };

  // Drag and drop handlers for actions
  const handleActionDragStart = (e: React.DragEvent, action: ActionType) => {
    e.dataTransfer.setData('action', action);
  };

  const handleActionDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleActionDoubleClick = (action: ActionType) => {
    handleAddActionToRow(action);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* State Diagram Panel */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Button
            onClick={handleAddState}
            size="sm"
            variant="outline"
            className="gap-2"
            title="Add new state"
          >
            <Plus className="h-4 w-4" />
            Add State
          </Button>
          <Button
            onClick={handleSetAsStart}
            size="sm"
            variant="outline"
            className="gap-2"
            disabled={!selectedStateId || selectedStateId === program.stopStateId}
            title="Set selected state as start state"
          >
            <Play className="h-4 w-4" />
            Set as Start
          </Button>
          <Button
            onClick={handleDeleteState}
            size="sm"
            variant="outline"
            className="gap-2"
            disabled={!selectedStateId || selectedStateId === program.stopStateId}
            title="Delete selected state"
          >
            <Trash2 className="h-4 w-4" />
            Delete State
          </Button>
        </div>

        {/* State Diagram Canvas */}
        <div className="relative w-full h-64 bg-muted/20 rounded-lg border-2 border-border">
          {/* Zoom Controls */}
          <div className="absolute top-2 right-2 z-20 flex gap-1 bg-background/80 backdrop-blur-sm rounded-md border border-border p-1">
            <button
              onClick={() => setDiagramZoom(z => Math.min(z + 0.25, 2))}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDiagramZoom(z => Math.max(z - 0.25, 0.5))}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDiagramZoom(1)}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="Reset zoom"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground px-1 flex items-center">
              {Math.round(diagramZoom * 100)}%
            </span>
          </div>

          {/* Scrollable Container */}
          <div
            className="absolute inset-0 overflow-auto select-none"
            data-scroll-container
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Zoomable Content Wrapper - sets scrollable area size */}
            <div
              className="relative origin-top-left"
              style={{
                width: `${canvasWidth * diagramZoom}px`,
                height: `${canvasHeight * diagramZoom}px`,
                minWidth: '100%',
                minHeight: '100%',
              }}
            >
            {/* Scaled Content */}
            <div
              className="relative origin-top-left"
              style={{
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                transform: `scale(${diagramZoom})`,
              }}
            >
          {/* SVG Layer for Transition Arrows */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon points="0 0, 10 3, 0 6" fill="currentColor" className="text-foreground" />
              </marker>
              <marker
                id="arrowhead-active"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon points="0 0, 10 3, 0 6" fill="rgb(34, 197, 94)" />
              </marker>
              {/* Bidirectional arrow markers (start side) */}
              <marker
                id="arrowhead-start"
                markerWidth="10"
                markerHeight="10"
                refX="1"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon points="10 0, 0 3, 10 6" fill="currentColor" className="text-foreground" />
              </marker>
              <marker
                id="arrowhead-start-active"
                markerWidth="10"
                markerHeight="10"
                refX="1"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon points="10 0, 0 3, 10 6" fill="rgb(34, 197, 94)" />
              </marker>
            </defs>
            {(() => {
              // Helper functions for bidirectional arrow detection
              const getPairKey = (id1: string, id2: string) => {
                return [id1, id2].sort().join('|');
              };

              const hasTransition = (fromStateId: string, toStateId: string) => {
                const fromState = program.states.find((s) => s.id === fromStateId);
                if (!fromState) return false;
                return fromState.transitions?.some((t) => t.targetStateId === toStateId) || false;
              };

              // Collect all unique connections (for bidirectional detection)
              const processedPairs = new Set<string>();
              const arrows: JSX.Element[] = [];

              program.states.forEach((state) => {
                const transitions = state.transitions || [];
                const uniqueTargets = Array.from(new Set(transitions.map((t) => t.targetStateId)));

                // Calculate which quadrants are occupied by arrows (for self-loop positioning)
                const isStartState = state.id === program.startStateId;
                const occupiedAngles: number[] = [];

                if (isStartState) {
                  occupiedAngles.push(Math.PI);
                }

                uniqueTargets.forEach((targetId) => {
                  if (targetId !== state.id) {
                    const targetState = program.states.find((s) => s.id === targetId);
                    if (targetState) {
                      const angle = Math.atan2(targetState.y - state.y, targetState.x - state.x);
                      occupiedAngles.push(angle);
                    }
                  }
                });

                const findBestLoopPosition = () => {
                  const candidates = [
                    { angle: -Math.PI / 2, name: 'top' },
                    { angle: 0, name: 'right' },
                    { angle: Math.PI / 2, name: 'bottom' },
                    { angle: Math.PI, name: 'left' },
                  ];

                  let bestCandidate = candidates[0];
                  let maxMinDistance = -Infinity;

                  candidates.forEach((candidate) => {
                    let minDistance = Infinity;
                    occupiedAngles.forEach((occupied) => {
                      let diff = candidate.angle - occupied;
                      while (diff > Math.PI) diff -= 2 * Math.PI;
                      while (diff < -Math.PI) diff += 2 * Math.PI;
                      minDistance = Math.min(minDistance, Math.abs(diff));
                    });

                    if (minDistance > maxMinDistance) {
                      maxMinDistance = minDistance;
                      bestCandidate = candidate;
                    }
                  });

                  return bestCandidate.angle;
                };

                uniqueTargets.forEach((targetId) => {
                  const targetState = program.states.find((s) => s.id === targetId);
                  if (!targetState) return;

                  const sourceRadius = state.id === program.stopStateId ? 48 : 40;
                  const targetRadius = targetState.id === program.stopStateId ? 48 : 40;

                  // Self-loop (always render)
                  if (state.id === targetId) {
                    const isArrowHighlighted = executionPhase === 'showing-arrow' &&
                      transitionFromState === state.id &&
                      transitionToState === targetId;

                    const loopSize = 40;
                    const bestPosition = findBestLoopPosition();
                    const startAngle = bestPosition - Math.PI / 6;
                    const endAngle = bestPosition + Math.PI / 6;

                    const startX = state.x + sourceRadius * Math.cos(startAngle);
                    const startY = state.y + sourceRadius * Math.sin(startAngle);
                    const endX = state.x + sourceRadius * Math.cos(endAngle);
                    const endY = state.y + sourceRadius * Math.sin(endAngle);

                    const controlOffset = loopSize;
                    const control1X = startX + controlOffset * Math.cos(bestPosition);
                    const control1Y = startY + controlOffset * Math.sin(bestPosition);
                    const control2X = endX + controlOffset * Math.cos(bestPosition);
                    const control2Y = endY + controlOffset * Math.sin(bestPosition);

                    const arrowAngle = Math.atan2(endY - control2Y, endX - control2X);
                    const arrowSize = 8;

                    arrows.push(
                      <g key={`${state.id}-${targetId}`}>
                        <path
                          d={`M ${startX} ${startY} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${endX} ${endY}`}
                          fill="none"
                          stroke={isArrowHighlighted ? 'rgb(34, 197, 94)' : 'currentColor'}
                          strokeWidth={isArrowHighlighted ? 3 : 2}
                          className={isArrowHighlighted ? '' : 'text-foreground'}
                        />
                        <polygon
                          points={`${endX},${endY} ${endX - arrowSize * Math.cos(arrowAngle - 0.4)},${endY - arrowSize * Math.sin(arrowAngle - 0.4)} ${endX - arrowSize * Math.cos(arrowAngle + 0.4)},${endY - arrowSize * Math.sin(arrowAngle + 0.4)}`}
                          fill={isArrowHighlighted ? 'rgb(34, 197, 94)' : 'currentColor'}
                          className={isArrowHighlighted ? '' : 'text-foreground'}
                        />
                      </g>
                    );
                    return;
                  }

                  // Check for bidirectional connection
                  const pairKey = getPairKey(state.id, targetId);
                  if (processedPairs.has(pairKey)) return;

                  const isBidirectional = hasTransition(state.id, targetId) && hasTransition(targetId, state.id);

                  if (isBidirectional) {
                    processedPairs.add(pairKey);

                    // Calculate geometry for curved arcs
                    const dx = targetState.x - state.x;
                    const dy = targetState.y - state.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx);

                    // Perpendicular vector for curve control points
                    const perpX = -dy / distance;
                    const perpY = dx / distance;

                    // Curve offset scales with distance, capped at 40px
                    const curveOffset = Math.min(40, distance * 0.25);

                    // Midpoint
                    const midX = (state.x + targetState.x) / 2;
                    const midY = (state.y + targetState.y) / 2;

                    // Control points for the two arcs
                    const controlPoint1 = {
                      x: midX + perpX * curveOffset,
                      y: midY + perpY * curveOffset,
                    };
                    const controlPoint2 = {
                      x: midX - perpX * curveOffset,
                      y: midY - perpY * curveOffset,
                    };

                    // Start/end points for arc from state -> targetState
                    const startX1 = state.x + Math.cos(angle) * sourceRadius;
                    const startY1 = state.y + Math.sin(angle) * sourceRadius;
                    const endX1 = targetState.x - Math.cos(angle) * (targetRadius + 8);
                    const endY1 = targetState.y - Math.sin(angle) * (targetRadius + 8);

                    // Start/end points for arc from targetState -> state (reverse direction)
                    const startX2 = targetState.x - Math.cos(angle) * targetRadius;
                    const startY2 = targetState.y - Math.sin(angle) * targetRadius;
                    const endX2 = state.x + Math.cos(angle) * (sourceRadius + 8);
                    const endY2 = state.y + Math.sin(angle) * (sourceRadius + 8);

                    // Check which direction is highlighted
                    const isForwardHighlighted = executionPhase === 'showing-arrow' &&
                      transitionFromState === state.id &&
                      transitionToState === targetId;
                    const isReverseHighlighted = executionPhase === 'showing-arrow' &&
                      transitionFromState === targetId &&
                      transitionToState === state.id;

                    // Arc 1: state -> targetState
                    arrows.push(
                      <path
                        key={`arc-${state.id}-to-${targetId}`}
                        d={`M ${startX1} ${startY1} Q ${controlPoint1.x} ${controlPoint1.y} ${endX1} ${endY1}`}
                        fill="none"
                        stroke={isForwardHighlighted ? 'rgb(34, 197, 94)' : 'currentColor'}
                        strokeWidth={isForwardHighlighted ? 3 : 2}
                        markerEnd={isForwardHighlighted ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                        className={isForwardHighlighted ? '' : 'text-foreground'}
                      />
                    );

                    // Arc 2: targetState -> state
                    arrows.push(
                      <path
                        key={`arc-${targetId}-to-${state.id}`}
                        d={`M ${startX2} ${startY2} Q ${controlPoint2.x} ${controlPoint2.y} ${endX2} ${endY2}`}
                        fill="none"
                        stroke={isReverseHighlighted ? 'rgb(34, 197, 94)' : 'currentColor'}
                        strokeWidth={isReverseHighlighted ? 3 : 2}
                        markerEnd={isReverseHighlighted ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                        className={isReverseHighlighted ? '' : 'text-foreground'}
                      />
                    );
                  } else {
                    // Unidirectional arrow
                    const isArrowHighlighted = executionPhase === 'showing-arrow' &&
                      transitionFromState === state.id &&
                      transitionToState === targetId;

                    const dx = targetState.x - state.x;
                    const dy = targetState.y - state.y;
                    const angle = Math.atan2(dy, dx);

                    const startX = state.x + Math.cos(angle) * sourceRadius;
                    const startY = state.y + Math.sin(angle) * sourceRadius;
                    const endX = targetState.x - Math.cos(angle) * (targetRadius + 8);
                    const endY = targetState.y - Math.sin(angle) * (targetRadius + 8);

                    arrows.push(
                      <line
                        key={`${state.id}-${targetId}`}
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke={isArrowHighlighted ? 'rgb(34, 197, 94)' : 'currentColor'}
                        strokeWidth={isArrowHighlighted ? 3 : 2}
                        markerEnd={isArrowHighlighted ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                        className={isArrowHighlighted ? '' : 'text-foreground'}
                      />
                    );
                  }
                });
              });

              return arrows;
            })()}
          </svg>

          {/* Render States */}
          {program.states.map((state) => {
            const isStopState = state.id === program.stopStateId;
            const isSelected = state.id === selectedStateId;
            const isStartState = state.id === program.startStateId;

            // Use highlightedStateId for state highlighting (matching SideBySideView)
            const isStateHighlighted = highlightedStateId === state.id;

            // Check if start arrow should be highlighted (when transitioning to the start state from idle)
            const isStartArrowHighlighted = isStartState && executionPhase === 'showing-arrow' && transitionFromState === null;

            const radius = isStopState ? 48 : 40; // Half of state bubble size (96px/80px)

            return (
              <div
                key={state.id}
                className="absolute"
                style={{
                  left: `${state.x}px`,
                  top: `${state.y}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Start Arrow - rigidly bound to the left of the state */}
                {isStartState && (
                  <div
                    className="absolute flex items-center pointer-events-none"
                    style={{
                      right: `calc(50% + ${radius + 2}px)`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  >
                    <span className="text-sm font-semibold mr-1.5">start</span>
                    <svg width="30" height="20" className={isStartArrowHighlighted ? 'text-green-500' : 'text-foreground'}>
                      <line x1="0" y1="10" x2="30" y2="10" stroke="currentColor" strokeWidth="2" />
                      <polygon points="30,10 25,7 25,13" fill="currentColor" />
                    </svg>
                  </div>
                )}

                {/* State Bubble */}
                <div
                  className={`flex flex-col items-center justify-center rounded-full border-4 transition-all cursor-pointer ${
                    isStopState
                      ? 'w-24 h-24 bg-background border-border hover:border-accent/50'
                      : 'w-20 h-20'
                  } ${
                    isStateHighlighted && !isStopState
                      ? 'bg-green-500/20 border-green-500 ring-4 ring-green-500/30 scale-110 shadow-lg shadow-green-500/20'
                      : !isStopState
                        ? 'bg-primary/20 border-primary hover:border-accent'
                        : ''
                  } ${isSelected && !isStateHighlighted ? 'ring-4 ring-accent ring-offset-2' : ''}`}
                  onMouseDown={(e) => handleMouseDown(e, state.id)}
                  onClick={() => setSelectedStateId(state.id)}
                >
                  <span
                    className="font-semibold text-center px-1 overflow-hidden leading-tight"
                    style={{
                      fontSize: state.name.length > 20 ? '8px' : state.name.length > 12 ? '9px' : '11px',
                      maxWidth: isStopState ? '80px' : '64px',
                      maxHeight: isStopState ? '60px' : '48px',
                      display: '-webkit-box',
                      WebkitLineClamp: state.name.length > 20 ? 3 : 2,
                      WebkitBoxOrient: 'vertical',
                      wordBreak: 'break-word',
                    }}
                    title={state.name}
                  >
                    {state.name}
                  </span>
                </div>
              </div>
            );
          })}
            </div>
            </div>
          </div>
        </div>
      </Card>

      {/* State Editor Tabs */}
      <Card className="flex-1 p-4">
        <h3 className="text-sm font-semibold mb-3">State Editor</h3>
        {editableStates.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Click "Add State" to create your first state
          </div>
        ) : (
          <div>
            {/* Custom Tab Bar with EditableTab components */}
            <div className="flex items-center gap-1 border-b border-border overflow-x-auto pb-0">
              {editableStates.map((state) => (
                <EditableTab
                  key={state.id}
                  name={state.name}
                  isSelected={selectedStateId === state.id}
                  isStart={state.id === program.startStateId}
                  onSelect={() => setSelectedStateId(state.id)}
                  onRename={(newName) => {
                    onUpdateProgram({
                      ...program,
                      states: program.states.map((s) =>
                        s.id === state.id ? { ...s, name: newName } : s
                      ),
                    });
                  }}
                  onDelete={() => {
                    const newStates = program.states.filter((s) => s.id !== state.id);
                    // Redirect transitions pointing to deleted state back to their own state (self-loop)
                    const updatedStates = newStates.map((s) => ({
                      ...s,
                      transitions: s.transitions.map((t) =>
                        t.targetStateId === state.id ? { ...t, targetStateId: s.id } : t
                      ),
                    }));
                    let newStartStateId = program.startStateId;
                    if (program.startStateId === state.id) {
                      newStartStateId = null;
                    }
                    onUpdateProgram({
                      ...program,
                      states: updatedStates,
                      startStateId: newStartStateId,
                    });
                    const nextState = editableStates.find((s) => s.id !== state.id);
                    setSelectedStateId(nextState?.id || program.stopStateId);
                  }}
                  maxLength={30}
                />
              ))}
              <button
                onClick={handleAddState}
                className="px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-t-md transition-colors flex-shrink-0"
                title="Add new state"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Tab Content */}
            {editableStates.map((state) => (
              selectedStateId === state.id ? (
                <div key={state.id} className="mt-4">
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-medium mb-2">Functions</h4>
                    <div className="flex gap-4">
                      {/* Left Column - Commands */}
                      <div className="w-32 space-y-1 flex-shrink-0">
                        <div
                          draggable
                          onDragStart={(e) => handleActionDragStart(e, 'move')}
                          onDoubleClick={() => handleActionDoubleClick('move')}
                          className="flex flex-col items-center gap-1 p-2 bg-secondary rounded cursor-move hover:bg-secondary/80 border border-border"
                          title="Move Forward"
                        >
                          <span className="text-2xl">↑</span>
                        </div>
                        <div
                          draggable
                          onDragStart={(e) => handleActionDragStart(e, 'turnLeft')}
                          onDoubleClick={() => handleActionDoubleClick('turnLeft')}
                          className="flex flex-col items-center gap-1 p-2 bg-secondary rounded cursor-move hover:bg-secondary/80 border border-border"
                          title="Turn Left"
                        >
                          <span className="text-2xl">↶</span>
                        </div>
                        <div
                          draggable
                          onDragStart={(e) => handleActionDragStart(e, 'turnRight')}
                          onDoubleClick={() => handleActionDoubleClick('turnRight')}
                          className="flex flex-col items-center gap-1 p-2 bg-secondary rounded cursor-move hover:bg-secondary/80 border border-border"
                          title="Turn Right"
                        >
                          <span className="text-2xl">↷</span>
                        </div>
                        <div
                          draggable
                          onDragStart={(e) => handleActionDragStart(e, 'pickClover')}
                          onDoubleClick={() => handleActionDoubleClick('pickClover')}
                          className="flex flex-col items-center gap-1 p-2 bg-secondary rounded cursor-move hover:bg-secondary/80 border border-border"
                          title="Pick Clover"
                        >
                          <PickCloverIcon size="text-2xl" />
                        </div>
                        <div
                          draggable
                          onDragStart={(e) => handleActionDragStart(e, 'placeClover')}
                          onDoubleClick={() => handleActionDoubleClick('placeClover')}
                          className="flex flex-col items-center gap-1 p-2 bg-secondary rounded cursor-move hover:bg-secondary/80 border border-border"
                          title="Place Clover"
                        >
                          <PlaceCloverIcon size="text-2xl" />
                        </div>
                      </div>

                      {/* Center - Detectors and Transition Rows */}
                      <div className="flex-1 space-y-3 min-w-0 overflow-hidden">
                        {/* Detectors Section (shared by all rows) */}
                        <div className="border-2 border-border rounded-lg p-3 bg-muted/10">
                          <label className="text-xs font-medium text-muted-foreground mb-2 block">
                            Active Detectors
                          </label>
                          <div className="flex gap-2 flex-wrap">
                            {getActiveDetectors().map((detector) => (
                              <div
                                key={detector}
                                onClick={() => handleToggleDetector(detector)}
                                className="flex items-center justify-center p-1 bg-secondary rounded-lg border border-border cursor-pointer hover:bg-secondary/80"
                                title={`Remove ${
                                  detector === 'treeFront' ? 'tree front'
                                  : detector === 'treeLeft' ? 'tree left'
                                  : detector === 'treeRight' ? 'tree right'
                                  : detector === 'mushroomFront' ? 'mushroom front'
                                  : 'on clover'
                                } detector`}
                              >
                                <DetectorIcon type={detector} size={36} />
                              </div>
                            ))}
                            {getActiveDetectors().length === 0 && (
                              <span className="text-xs text-muted-foreground italic py-2">
                                Click detectors on the right to add →
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Transition Rows */}
                        <div className="space-y-2 min-w-0">
                          <label className="text-xs font-medium text-muted-foreground block">
                            Transitions (when detectors match)
                          </label>

                          {getCurrentRows().map((row) => {
                            const activeDetectors = getActiveDetectors();
                            // Check if this row is the currently executing transition
                            // For transition-matched/executing-action: transition row is in the current state
                            // For showing-arrow: transition row is in the current state (about to leave)
                            const isRowExecuting = currentExecutingTransitionId === row.id &&
                              (executionPhase === 'transition-matched' || executionPhase === 'executing-action') &&
                              selectedStateId === currentExecutingStateId;
                            const isRowTransitioning = currentExecutingTransitionId === row.id &&
                              executionPhase === 'showing-arrow' &&
                              selectedStateId === currentExecutingStateId;

                            return (
                              <div
                                key={row.id}
                                onClick={() => setSelectedRowId(row.id)}
                                className={`border-2 rounded-lg transition-all cursor-pointer overflow-hidden ${
                                  isRowExecuting
                                    ? 'border-green-500 ring-2 ring-green-500/50 bg-green-50/50 dark:bg-green-950/20 shadow-lg shadow-green-500/20'
                                    : selectedRowId === row.id
                                      ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20'
                                      : 'border-border bg-muted/20 hover:border-accent/50'
                                }`}
                              >
                                <div className="flex items-center gap-2 p-2 w-full">
                                  {/* Delete Button - Fixed on left */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteRow(row.id);
                                    }}
                                    className="flex-shrink-0 text-destructive hover:bg-destructive/10 rounded p-1 text-lg font-bold"
                                    title="Delete function"
                                  >
                                    ×
                                  </button>

                                  {/* Scrollable middle section for gates and actions */}
                                  <div className="flex-1 overflow-x-auto min-w-0 scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
                                    <div className="flex items-center gap-2 min-w-max">
                                      {/* Logic Gates aligned with detectors above */}
                                      <div className="flex gap-2 flex-shrink-0">
                                        {activeDetectors.map((detector) => {
                                          const state = row.detectorConditions[detector];
                                          return (
                                            <div
                                              key={detector}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleLogicGate(row.id, detector);
                                              }}
                                              className="flex items-center justify-center w-16 px-2 py-1 bg-background rounded border border-border cursor-pointer hover:bg-secondary/50 transition-colors flex-shrink-0"
                                              title={`Toggle ${detector} detector`}
                                            >
                                              <div className="text-xs font-bold">
                                                {state === true ? 'yes' : state === false ? 'no' : 'yes or no'}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* Separator */}
                                      <div className="w-px h-8 bg-border flex-shrink-0" />

                                      {/* Actions (horizontal row) */}
                                      <div
                                        className="flex items-center gap-2 min-h-[48px] px-2"
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const action = e.dataTransfer.getData('action') as ActionType;
                                          if (action && row.id === selectedRowId) {
                                            handleAddActionToRow(action);
                                          }
                                        }}
                                        onDragOver={handleActionDragOver}
                                      >
                                        {row.actions.length === 0 ? (
                                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                                            {selectedRowId === row.id
                                              ? 'Double-click or drag actions here'
                                              : 'No actions'}
                                          </div>
                                        ) : (
                                          row.actions.map((action, index) => {
                                            // Check if this specific action is being executed
                                            const isActionExecuting =
                                              isRowExecuting &&
                                              executionPhase === 'executing-action' &&
                                              index === currentActionIndex;

                                            // Check if this action has already been executed in current transition
                                            const isActionCompleted =
                                              isRowExecuting &&
                                              executionPhase === 'executing-action' &&
                                              index < currentActionIndex;

                                            // Check if action is pending (not yet executed)
                                            const isActionPending =
                                              isRowExecuting &&
                                              (executionPhase === 'transition-matched' ||
                                               (executionPhase === 'executing-action' && index > currentActionIndex));

                                            return (
                                              <div
                                                key={index}
                                                className={`relative flex items-center gap-1 px-2 py-1 rounded-full border flex-shrink-0 transition-all ${
                                                  isActionExecuting
                                                    ? 'bg-green-500/30 border-green-500 ring-2 ring-green-500/50 scale-110 shadow-lg shadow-green-500/30'
                                                    : isActionCompleted
                                                    ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 opacity-60'
                                                    : isActionPending
                                                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
                                                    : 'bg-secondary border-border'
                                                }`}
                                              >
                                                <span className="text-xl">
                                                  {action.type === 'move' && '↑'}
                                                  {action.type === 'turnLeft' && '↶'}
                                                  {action.type === 'turnRight' && '↷'}
                                                  {action.type === 'pickClover' && <PickCloverIcon size="text-lg" />}
                                                  {action.type === 'placeClover' && <PlaceCloverIcon size="text-lg" />}
                                                </span>
                                                {isActionExecuting && (
                                                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping" />
                                                )}
                                                {!isExecuting && (
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleRemoveActionFromRow(row.id, index);
                                                    }}
                                                    className="text-xs hover:text-destructive"
                                                  >
                                                    ×
                                                  </button>
                                                )}
                                              </div>
                                            );
                                          })
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Next State Dropdown - Fixed on right */}
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                      Next State:
                                    </label>
                                    <select
                                      value={row.targetStateId}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleUpdateRowTarget(row.id, e.target.value);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className={`px-2 py-1 text-sm border rounded-md min-w-[120px] transition-all ${
                                        isRowTransitioning
                                          ? 'border-green-500 ring-2 ring-green-500/50 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold'
                                          : 'border-border bg-background text-foreground'
                                      }`}
                                    >
                                      {program.states.map((s) => (
                                        <option key={s.id} value={s.id}>
                                          {s.name}
                                        </option>
                                      ))}
                                      <option disabled>───────────</option>
                                      <option value="__new_state__" className="text-green-600 font-semibold">
                                        + New State
                                      </option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Add Row Button */}
                          <button
                            onClick={handleAddRow}
                            className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-accent hover:text-accent transition-all"
                          >
                            + Add Transition
                          </button>
                        </div>
                      </div>

                      {/* Right Column - Detectors */}
                      <div className="w-20 flex flex-col gap-1">
                        {/* Detectors Label */}
                        <div className="text-xs font-semibold text-muted-foreground text-center pb-1 border-b border-border mb-1">
                          Detectors
                        </div>

                        {(['treeFront', 'treeLeft', 'treeRight', 'mushroomFront', 'onLeaf'] as DetectorType[]).map(
                          (detector) => {
                            const isActive = getActiveDetectors().includes(detector);
                            return (
                              <div
                                key={detector}
                                onClick={() => handleToggleDetector(detector)}
                                className={`flex items-center justify-center p-1 rounded cursor-pointer transition-all ${
                                  isActive
                                    ? 'bg-accent/20 border-2 border-accent/50 hover:bg-accent/30'
                                    : 'bg-secondary border border-border hover:bg-secondary/80'
                                }`}
                                title={
                                  detector === 'treeFront'
                                    ? 'Tree in front?'
                                    : detector === 'treeLeft'
                                    ? 'Tree to the left?'
                                    : detector === 'treeRight'
                                    ? 'Tree to the right?'
                                    : detector === 'mushroomFront'
                                    ? 'Mushroom in front?'
                                    : 'Standing on clover?'
                                }
                              >
                                <DetectorIcon type={detector} size={48} />
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null
            ))}
          </div>
        )}
      </Card>

      {/* Current Executing State Info */}
      {isExecuting && currentExecutingStateId && (
        <Card className="p-3 bg-green-500/10 border-green-500/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">
              {executionPhase === 'showing-arrow' && 'Transitioning to: '}
              {executionPhase === 'transition-matched' && 'Transition Matched: '}
              {executionPhase === 'executing-action' && 'Executing Action: '}
              {executionPhase === 'idle' && 'Current State: '}
              <span className="text-green-600 dark:text-green-400 ml-1">
                {program.states.find(s => s.id === currentExecutingStateId)?.name || 'Unknown'}
              </span>
            </span>
          </div>
        </Card>
      )}

    </div>
  );
};

export default FSMEditor;
