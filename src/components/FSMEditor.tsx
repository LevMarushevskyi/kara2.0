import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FSMProgram,
  FSMState,
  DetectorType,
  downloadFSMAsKaraX,
  parseFSMContent,
  isValidFSMProgram,
} from '@/models/fsm';
import { Plus, Play, Trash2, Download, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface FSMEditorProps {
  program: FSMProgram;
  onUpdateProgram: (program: FSMProgram) => void;
}

type ActionType = 'move' | 'turnLeft' | 'turnRight' | 'pickClover' | 'placeClover';

const FSMEditor = ({ program, onUpdateProgram }: FSMEditorProps) => {
  const [selectedStateId, setSelectedStateId] = useState<string>(
    program.states.find((s) => s.id !== program.stopStateId)?.id || program.stopStateId
  );
  const [draggingStateId, setDraggingStateId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

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

  const handleExportFSM = () => {
    downloadFSMAsKaraX(program, 'kara-fsm-program.kara');
    toast.success('FSM program exported successfully!');
  };

  const handleImportFSM = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.kara,.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const importedProgram = parseFSMContent(content);
          if (isValidFSMProgram(importedProgram)) {
            onUpdateProgram(importedProgram);
            // Select first editable state
            const firstEditable = importedProgram.states.find(
              (s) => s.id !== importedProgram.stopStateId
            );
            if (firstEditable) {
              setSelectedStateId(firstEditable.id);
            }
            toast.success('FSM program imported successfully!');
          } else {
            toast.error('Invalid FSM program file!');
          }
        } catch (error) {
          toast.error('Failed to import FSM program. Invalid file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
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
          <div className="flex-1" />
          <Button
            onClick={handleExportFSM}
            size="sm"
            variant="outline"
            className="gap-2"
            title="Export FSM program to .kara file"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={handleImportFSM}
            size="sm"
            variant="outline"
            className="gap-2"
            title="Import FSM program from .kara file"
          >
            <Upload className="h-4 w-4" />
            Import
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
            </defs>
            {program.states.map((state) => {
              const transitions = state.transitions || [];
              // Get unique target states
              const uniqueTargets = Array.from(new Set(transitions.map((t) => t.targetStateId)));

              // Calculate which quadrants are occupied by arrows
              const isStartState = state.id === program.startStateId;
              const occupiedAngles: number[] = [];

              // Start arrow occupies the left side
              if (isStartState) {
                occupiedAngles.push(Math.PI); // 180 degrees (left)
              }

              // Calculate angles for outgoing arrows
              uniqueTargets.forEach((targetId) => {
                if (targetId !== state.id) {
                  const targetState = program.states.find((s) => s.id === targetId);
                  if (targetState) {
                    const angle = Math.atan2(targetState.y - state.y, targetState.x - state.x);
                    occupiedAngles.push(angle);
                  }
                }
              });

              // Find the best position for the self-loop (opposite side from occupied angles)
              const findBestLoopPosition = () => {
                // Possible positions: top (270°), right (0°), bottom (90°), left (180°)
                const candidates = [
                  { angle: -Math.PI / 2, name: 'top' },     // -90° (top)
                  { angle: 0, name: 'right' },              // 0° (right)
                  { angle: Math.PI / 2, name: 'bottom' },   // 90° (bottom)
                  { angle: Math.PI, name: 'left' },         // 180° (left)
                ];

                // Calculate the minimum distance from each candidate to all occupied angles
                let bestCandidate = candidates[0];
                let maxMinDistance = -Infinity;

                candidates.forEach((candidate) => {
                  let minDistance = Infinity;
                  occupiedAngles.forEach((occupied) => {
                    // Calculate angular distance (normalized to -π to π)
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

              return uniqueTargets.map((targetId) => {
                const targetState = program.states.find((s) => s.id === targetId);
                if (!targetState) return null;

                const sourceRadius = state.id === program.stopStateId ? 48 : 40;
                const targetRadius = targetState.id === program.stopStateId ? 48 : 40;

                // Self-loop
                if (state.id === targetId) {
                  const loopSize = 40;
                  const bestPosition = findBestLoopPosition();

                  // Calculate start and end angles based on best position
                  const startAngle = bestPosition - Math.PI / 6; // 30 degrees before
                  const endAngle = bestPosition + Math.PI / 6;   // 30 degrees after

                  const startX = state.x + sourceRadius * Math.cos(startAngle);
                  const startY = state.y + sourceRadius * Math.sin(startAngle);
                  const endX = state.x + sourceRadius * Math.cos(endAngle);
                  const endY = state.y + sourceRadius * Math.sin(endAngle);

                  // Control points for a smooth bezier curve (extend outward)
                  const controlOffset = loopSize;
                  const control1X = startX + controlOffset * Math.cos(bestPosition);
                  const control1Y = startY + controlOffset * Math.sin(bestPosition);
                  const control2X = endX + controlOffset * Math.cos(bestPosition);
                  const control2Y = endY + controlOffset * Math.sin(bestPosition);

                  // Calculate arrowhead angle (tangent at end point)
                  const arrowAngle = Math.atan2(endY - control2Y, endX - control2X);
                  const arrowSize = 8;

                  return (
                    <g key={`${state.id}-${targetId}`}>
                      {/* Curved path using cubic bezier */}
                      <path
                        d={`M ${startX} ${startY} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${endX} ${endY}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-foreground"
                      />
                      {/* Arrowhead */}
                      <polygon
                        points={`${endX},${endY} ${endX - arrowSize * Math.cos(arrowAngle - 0.4)},${endY - arrowSize * Math.sin(arrowAngle - 0.4)} ${endX - arrowSize * Math.cos(arrowAngle + 0.4)},${endY - arrowSize * Math.sin(arrowAngle + 0.4)}`}
                        fill="currentColor"
                        className="text-foreground"
                      />
                    </g>
                  );
                }

                // Calculate angle from source to target
                const dx = targetState.x - state.x;
                const dy = targetState.y - state.y;
                const angle = Math.atan2(dy, dx);

                // Start point: edge of source circle
                const startX = state.x + Math.cos(angle) * sourceRadius;
                const startY = state.y + Math.sin(angle) * sourceRadius;

                // End point: edge of target circle
                const endX = targetState.x - Math.cos(angle) * (targetRadius + 8); // +8 for arrowhead
                const endY = targetState.y - Math.sin(angle) * (targetRadius + 8);

                return (
                  <line
                    key={`${state.id}-${targetId}`}
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke="currentColor"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                    className="text-foreground"
                  />
                );
              });
            })}
          </svg>

          {/* Render States */}
          {program.states.map((state) => {
            const isStopState = state.id === program.stopStateId;
            const isSelected = state.id === selectedStateId;
            const isStartState = state.id === program.startStateId;
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
                    <svg width="30" height="20" className="text-foreground">
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
                      : 'w-20 h-20 bg-primary/20 border-primary hover:border-accent'
                  } ${isSelected ? 'ring-4 ring-accent ring-offset-2' : ''}`}
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

                  <div>
                    <h4 className="text-sm font-medium mb-2">Functions</h4>
                    <div className="flex gap-4">
                      {/* Left Column - Commands */}
                      <div className="w-32 space-y-1">
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
                      <div className="flex-1 space-y-3">
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
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground block">
                            Transitions (when detectors match)
                          </label>

                          {getCurrentRows().map((row) => {
                            const activeDetectors = getActiveDetectors();

                            return (
                              <div
                                key={row.id}
                                onClick={() => setSelectedRowId(row.id)}
                                className={`border-2 rounded-lg transition-all cursor-pointer ${
                                  selectedRowId === row.id
                                    ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20'
                                    : 'border-border bg-muted/20 hover:border-accent/50'
                                }`}
                              >
                                <div className="flex items-center gap-2 p-2">
                                  {/* Delete Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteRow(row.id);
                                    }}
                                    className="text-destructive hover:bg-destructive/10 rounded p-1 text-lg font-bold"
                                    title="Delete function"
                                  >
                                    ×
                                  </button>

                                  {/* Logic Gates aligned with detectors above */}
                                  <div className="flex gap-2">
                                    {activeDetectors.map((detector) => {
                                      const state = row.detectorConditions[detector];
                                      return (
                                        <div
                                          key={detector}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleLogicGate(row.id, detector);
                                          }}
                                          className="flex items-center justify-center w-16 px-2 py-1 bg-background rounded border border-border cursor-pointer hover:bg-secondary/50 transition-colors"
                                          title={`Toggle ${detector} detector`}
                                        >
                                          <div className="text-xs font-bold">
                                            {state === true ? 'yes' : state === false ? 'no' : 'yes or no'}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Actions (horizontal row) */}
                                  <div
                                    className="flex-1 flex items-center gap-2 min-h-[48px] px-2"
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
                                      <div className="text-xs text-muted-foreground">
                                        {selectedRowId === row.id
                                          ? 'Drag actions here'
                                          : 'No actions'}
                                      </div>
                                    ) : (
                                      row.actions.map((action, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-full border border-border"
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

                                  {/* Next State Dropdown */}
                                  <div className="flex items-center gap-2">
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
                                      className="px-2 py-1 text-sm border border-border rounded-md bg-background text-foreground min-w-[120px]"
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
    </div>
  );
};

export default FSMEditor;
