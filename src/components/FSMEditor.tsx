import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FSMProgram,
  FSMState,
  DetectorType,
} from '@/models/fsm';
import { Plus, Play, Trash2 } from 'lucide-react';
import { useState } from 'react';

// Execution phase type for FSM visualization
type FSMExecutionPhase = 'idle' | 'on-state' | 'transition-arrow';

interface FSMEditorProps {
  program: FSMProgram;
  onUpdateProgram: (program: FSMProgram) => void;
  // Execution highlighting props
  currentExecutingStateId?: string | null;
  currentExecutingTransitionId?: string | null;
  previousStateId?: string | null; // For arrow highlighting - where we came from
  executionPhase?: 'idle' | 'on-state' | 'showing-arrow'; // Phase controlled by parent
  isExecuting?: boolean;
}

type ActionType = 'move' | 'turnLeft' | 'turnRight' | 'pickClover' | 'placeClover';

const FSMEditor = ({
  program,
  onUpdateProgram,
  currentExecutingStateId = null,
  currentExecutingTransitionId = null,
  previousStateId: parentPreviousStateId = null,
  executionPhase: parentExecutionPhase = 'idle',
  isExecuting = false,
}: FSMEditorProps) => {
  const [selectedStateId, setSelectedStateId] = useState<string>(
    program.states.find((s) => s.id !== program.stopStateId)?.id || program.stopStateId
  );
  const [draggingStateId, setDraggingStateId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Derive execution phase and highlighting from parent-controlled state
  // Map parent phase to internal FSMExecutionPhase for rendering
  const executionPhase: FSMExecutionPhase = parentExecutionPhase === 'showing-arrow' ? 'transition-arrow' :
                                             parentExecutionPhase === 'on-state' ? 'on-state' : 'idle';

  // Determine what should be highlighted based on parent-controlled phase
  // When 'on-state': highlight the current state
  // When 'showing-arrow': highlight the arrow from previous to current state
  const highlightedStateId = parentExecutionPhase === 'on-state' ? currentExecutingStateId : null;
  const transitionFromState = parentExecutionPhase === 'showing-arrow' ? parentPreviousStateId : null;
  const transitionToState = parentExecutionPhase === 'showing-arrow' ? currentExecutingStateId : null;

  const editableStates = program.states.filter((s) => s.id !== program.stopStateId);

  const handleAddState = () => {
    const newStateId = `state-${Date.now()}`;
    const newState: FSMState = {
      id: newStateId,
      name: `State ${editableStates.length + 1}`,
      x: 150 + editableStates.length * 80,
      y: 100,
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
      const cleanedStates = newStates.map((state) => ({
        ...state,
        transitions: state.transitions.filter((t) => t.targetStateId !== selectedStateId),
      }));

      // If we deleted the start state, clear it
      let newStartStateId = program.startStateId;
      if (program.startStateId === selectedStateId) {
        newStartStateId = null;
      }

      onUpdateProgram({
        ...program,
        states: cleanedStates,
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

    const rect = e.currentTarget.getBoundingClientRect();
    setDraggingStateId(stateId);
    setDragOffset({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingStateId) return;

    const container = e.currentTarget.getBoundingClientRect();
    const newX = e.clientX - container.left - dragOffset.x;
    const newY = e.clientY - container.top - dragOffset.y;

    onUpdateProgram({
      ...program,
      states: program.states.map((state) =>
        state.id === draggingStateId ? { ...state, x: Math.max(0, newX), y: Math.max(0, newY) } : state
      ),
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
        <div
          className="relative w-full h-64 bg-muted/20 rounded-lg border-2 border-border overflow-hidden select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
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
                    const isArrowHighlighted = executionPhase === 'transition-arrow' &&
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

                    // Determine which direction is highlighted
                    const isForwardHighlighted = executionPhase === 'transition-arrow' &&
                      transitionFromState === state.id &&
                      transitionToState === targetId;
                    const isReverseHighlighted = executionPhase === 'transition-arrow' &&
                      transitionFromState === targetId &&
                      transitionToState === state.id;
                    const isHighlighted = isForwardHighlighted || isReverseHighlighted;

                    // Calculate arrow geometry
                    const dx = targetState.x - state.x;
                    const dy = targetState.y - state.y;
                    const angle = Math.atan2(dy, dx);

                    const startX = state.x + Math.cos(angle) * (sourceRadius + 8);
                    const startY = state.y + Math.sin(angle) * (sourceRadius + 8);
                    const endX = targetState.x - Math.cos(angle) * (targetRadius + 8);
                    const endY = targetState.y - Math.sin(angle) * (targetRadius + 8);

                    arrows.push(
                      <line
                        key={`bidirectional-${pairKey}`}
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke={isHighlighted ? 'rgb(34, 197, 94)' : 'currentColor'}
                        strokeWidth={isHighlighted ? 3 : 2}
                        markerStart={isHighlighted ? 'url(#arrowhead-start-active)' : 'url(#arrowhead-start)'}
                        markerEnd={isHighlighted ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                        className={isHighlighted ? '' : 'text-foreground'}
                      />
                    );
                  } else {
                    // Unidirectional arrow
                    const isArrowHighlighted = executionPhase === 'transition-arrow' &&
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
            const isStartArrowHighlighted = isStartState && executionPhase === 'transition-arrow' && transitionFromState === null;

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
                  <span className="text-xs font-semibold text-center px-2 overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                    {state.name}
                  </span>
                </div>
              </div>
            );
          })}
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
          <Tabs value={selectedStateId} onValueChange={setSelectedStateId}>
            <TabsList className="w-full justify-start overflow-x-auto">
              {editableStates.map((state) => (
                <TabsTrigger key={state.id} value={state.id} className="min-w-fit">
                  {state.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {editableStates.map((state) => (
              <TabsContent key={state.id} value={state.id} className="mt-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">State Name</label>
                    <input
                      type="text"
                      value={state.name}
                      maxLength={15}
                      onChange={(e) => {
                        onUpdateProgram({
                          ...program,
                          states: program.states.map((s) =>
                            s.id === state.id ? { ...s, name: e.target.value } : s
                          ),
                        });
                      }}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground caret-black dark:caret-white"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {state.name.length}/15 characters
                    </p>
                  </div>

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
                          <span className="text-2xl">🍀</span>
                        </div>
                        <div
                          draggable
                          onDragStart={(e) => handleActionDragStart(e, 'placeClover')}
                          onDoubleClick={() => handleActionDoubleClick('placeClover')}
                          className="flex flex-col items-center gap-1 p-2 bg-secondary rounded cursor-move hover:bg-secondary/80 border border-border"
                          title="Place Clover"
                        >
                          <span className="text-2xl">⬇️</span>
                        </div>
                      </div>

                      {/* Center - Detectors and Transition Rows */}
                      <div className="flex-1 space-y-3 min-w-0 overflow-hidden">
                        {/* Detectors Section (shared by all rows) */}
                        <div className="border-2 border-border rounded-lg p-3 bg-muted/10">
                          <label className="text-xs font-medium text-muted-foreground mb-2 block">
                            Detectors
                          </label>
                          <div className="flex gap-2">
                            {getActiveDetectors().map((detector) => (
                              <div
                                key={detector}
                                onClick={() => handleToggleDetector(detector)}
                                className="flex flex-col items-center gap-1 px-3 py-2 bg-secondary rounded-lg border border-border cursor-pointer hover:bg-secondary/80 w-16"
                              >
                                <span className="text-xl flex items-center gap-0.5">
                                  {detector === 'treeFront' && (
                                    <>
                                      🌳<span className="text-xs font-bold">F</span>
                                    </>
                                  )}
                                  {detector === 'treeLeft' && (
                                    <>
                                      🌳<span className="text-xs font-bold">L</span>
                                    </>
                                  )}
                                  {detector === 'treeRight' && (
                                    <>
                                      🌳<span className="text-xs font-bold">R</span>
                                    </>
                                  )}
                                  {detector === 'mushroomFront' && '🍄'}
                                  {detector === 'onLeaf' && '🍀'}
                                </span>
                              </div>
                            ))}
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
                            // For on-state: transition row is in the current state (currentExecutingStateId)
                            // For transition-arrow: transition row is in the previous state (parentPreviousStateId)
                            const isRowExecuting = currentExecutingTransitionId === row.id &&
                              executionPhase === 'on-state' &&
                              selectedStateId === currentExecutingStateId;
                            const isRowTransitioning = currentExecutingTransitionId === row.id &&
                              executionPhase === 'transition-arrow' &&
                              selectedStateId === parentPreviousStateId;

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
                                              ? 'Drag actions here'
                                              : 'No actions'}
                                          </div>
                                        ) : (
                                          row.actions.map((action, index) => (
                                            <div
                                              key={index}
                                              className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-full border border-border flex-shrink-0"
                                            >
                                              <span className="text-xl">
                                                {action.type === 'move' && '↑'}
                                                {action.type === 'turnLeft' && '↶'}
                                                {action.type === 'turnRight' && '↷'}
                                                {action.type === 'pickClover' && '🍀'}
                                                {action.type === 'placeClover' && '⬇️'}
                                              </span>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleRemoveActionFromRow(row.id, index);
                                                }}
                                                className="text-xs hover:text-destructive"
                                              >
                                                ×
                                              </button>
                                            </div>
                                          ))
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
                      <div className="w-32 space-y-1">
                        {(['treeFront', 'treeLeft', 'treeRight', 'mushroomFront', 'onLeaf'] as DetectorType[]).map(
                          (detector) => {
                            const isActive = getActiveDetectors().includes(detector);
                            return (
                              <div
                                key={detector}
                                onClick={() => handleToggleDetector(detector)}
                                className={`flex flex-col items-center gap-1 p-2 rounded cursor-pointer transition-all ${
                                  isActive
                                    ? 'bg-accent/20 border-2 border-accent/50 hover:bg-accent/30'
                                    : 'bg-secondary border border-border hover:bg-secondary/80'
                                }`}
                                title={
                                  detector === 'treeFront'
                                    ? 'Tree Front'
                                    : detector === 'treeLeft'
                                    ? 'Tree Left'
                                    : detector === 'treeRight'
                                    ? 'Tree Right'
                                    : detector === 'mushroomFront'
                                    ? 'Mushroom Front'
                                    : 'On Leaf'
                                }
                              >
                              <span className="text-2xl">
                                {detector === 'treeFront' && '🌳'}
                                {detector === 'treeLeft' && '🌳'}
                                {detector === 'treeRight' && '🌳'}
                                {detector === 'mushroomFront' && '🍄'}
                                {detector === 'onLeaf' && '🍀'}
                              </span>
                              <span className="text-xs">
                                {detector === 'treeFront' && 'Front'}
                                {detector === 'treeLeft' && 'Left'}
                                {detector === 'treeRight' && 'Right'}
                                {detector === 'mushroomFront' && 'Front'}
                                {detector === 'onLeaf' && 'Leaf'}
                              </span>
                            </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </Card>

      {/* Current Executing State Info */}
      {isExecuting && currentExecutingStateId && (
        <Card className="p-3 bg-green-500/10 border-green-500/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">
              {executionPhase === 'transition-arrow' && 'Transitioning to: '}
              {executionPhase === 'on-state' && 'Current State: '}
              {executionPhase === 'idle' && 'Current State: '}
              <span className="text-green-600 dark:text-green-400 ml-1">
                {program.states.find(s => s.id === currentExecutingStateId)?.name || 'Unknown'}
              </span>
            </span>
          </div>
        </Card>
      )}

      {/* Read-only Transitions Panel during execution - shows transitions from the relevant state */}
      {isExecuting && (() => {
        // Determine which state's transitions to show
        const displayStateId = executionPhase === 'on-state' ? currentExecutingStateId :
                               executionPhase === 'transition-arrow' ? parentPreviousStateId :
                               currentExecutingStateId;
        const displayState = program.states.find(s => s.id === displayStateId);

        if (!displayState || displayStateId === program.stopStateId) return null;

        const transitions = displayState.transitions || [];
        if (transitions.length === 0) return null;

        // Detector labels
        const detectorLabels: Record<string, string> = {
          treeFront: 'Tree Front?',
          treeLeft: 'Tree Left?',
          treeRight: 'Tree Right?',
          mushroomFront: 'Mushroom?',
          onLeaf: 'On Clover?',
        };

        // Action icons
        const getActionIcon = (type: string) => {
          switch (type) {
            case 'move': return '↑';
            case 'turnLeft': return '↶';
            case 'turnRight': return '↷';
            case 'pickClover': return '🍀';
            case 'placeClover': return '⬇️';
            default: return '?';
          }
        };

        return (
          <Card className="p-3">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
              Transitions in "{displayState.name}"
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {transitions.map((transition) => {
                const isRowExecuting = currentExecutingTransitionId === transition.id &&
                  executionPhase === 'on-state';
                const isRowTransitioning = currentExecutingTransitionId === transition.id &&
                  executionPhase === 'transition-arrow';
                const targetState = program.states.find(s => s.id === transition.targetStateId);

                return (
                  <div
                    key={transition.id}
                    className={`border-2 rounded-lg p-2 transition-all ${
                      isRowExecuting
                        ? 'border-green-500 ring-2 ring-green-500/50 bg-green-50/50 dark:bg-green-950/20'
                        : 'border-border bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Detector conditions */}
                      <div className="flex gap-1 flex-wrap">
                        {Object.entries(transition.detectorConditions).map(([detector, value]) => {
                          if (value === null) return null;
                          return (
                            <span
                              key={detector}
                              className="text-xs px-1.5 py-0.5 bg-background rounded border border-border"
                            >
                              {detectorLabels[detector]?.replace('?', '')}: {value ? 'yes' : 'no'}
                            </span>
                          );
                        })}
                      </div>

                      {/* Arrow separator */}
                      <span className="text-muted-foreground">→</span>

                      {/* Actions */}
                      <div className="flex gap-1">
                        {transition.actions.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">no actions</span>
                        ) : (
                          transition.actions.map((action, idx) => (
                            <span
                              key={idx}
                              className="text-lg"
                              title={action.type}
                            >
                              {getActionIcon(action.type)}
                            </span>
                          ))
                        )}
                      </div>

                      {/* Arrow separator */}
                      <span className="text-muted-foreground">→</span>

                      {/* Next State */}
                      <span
                        className={`text-xs px-2 py-0.5 rounded border transition-all ${
                          isRowTransitioning
                            ? 'border-green-500 ring-2 ring-green-500/50 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold'
                            : 'border-border bg-background'
                        }`}
                      >
                        {targetState?.name || 'Unknown'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })()}
    </div>
  );
};

export default FSMEditor;
