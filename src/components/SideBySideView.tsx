import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipForward, Square, FastForward, ZoomIn, ZoomOut, Maximize, Bug } from 'lucide-react';
import WorldView from './WorldView';
import { World } from '@/models/types';
import { FSMProgram } from '@/models/fsm';
import { CommandType } from '@/models/program';
import { GridColorTheme, ViewMode } from '@/hooks/useSettings';

// Detector icon component - shows Kara with detected object in relative position
const DetectorIcon = ({
  type,
  size = 40
}: {
  type: 'treeFront' | 'treeLeft' | 'treeRight' | 'mushroomFront' | 'onLeaf';
  size?: number;
}) => {
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
          <div className="absolute inset-0 grid grid-cols-1 grid-rows-2 items-center justify-items-center">
            <span style={{ fontSize: emojiSize }}>🌳</span>
            <Bug className="text-red-500" size={bugSize} />
          </div>
          <span className="absolute text-muted-foreground font-bold" style={{ fontSize: questionSize, top: 2, right: 2 }}>?</span>
        </>
      )}
      {type === 'treeLeft' && (
        <>
          <div className="absolute inset-0 grid grid-cols-2 items-center justify-items-center">
            <span style={{ fontSize: emojiSize }}>🌳</span>
            <Bug className="text-red-500" size={bugSize} />
          </div>
          <span className="absolute text-muted-foreground font-bold" style={{ fontSize: questionSize, top: 2, right: 2 }}>?</span>
        </>
      )}
      {type === 'treeRight' && (
        <>
          <div className="absolute inset-0 grid grid-cols-2 items-center justify-items-center">
            <Bug className="text-red-500" size={bugSize} />
            <span style={{ fontSize: emojiSize }}>🌳</span>
          </div>
          <span className="absolute text-muted-foreground font-bold" style={{ fontSize: questionSize, top: 2, right: 2 }}>?</span>
        </>
      )}
      {type === 'mushroomFront' && (
        <>
          <div className="absolute inset-0 grid grid-cols-1 grid-rows-2 items-center justify-items-center">
            <span style={{ fontSize: emojiSize }}>🍄</span>
            <Bug className="text-red-500" size={bugSize} />
          </div>
          <span className="absolute text-muted-foreground font-bold" style={{ fontSize: questionSize, top: 2, right: 2 }}>?</span>
        </>
      )}
      {type === 'onLeaf' && (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="absolute opacity-40" style={{ fontSize: emojiSize * 1.2 }}>🍀</span>
            <Bug className="text-red-500 relative z-10" size={bugSize} />
          </div>
          <span className="absolute text-muted-foreground font-bold" style={{ fontSize: questionSize, top: 2, right: 2 }}>?</span>
        </>
      )}
    </div>
  );
};

interface SideBySideViewProps {
  // World state
  world: World;
  gridColorTheme: GridColorTheme;
  viewMode: ViewMode;

  // Execution state
  isRunning: boolean;
  isFsmRunning: boolean;
  isTextKaraRunning: boolean;
  executionSpeed: number;
  onExecutionSpeedChange: (speed: number) => void;

  // Execution controls
  onRun: () => void;
  onPause: () => void;
  onStep: () => void;
  onEnd: () => void;
  onSkip: () => void;

  // Program state - varies by mode
  programmingLanguage: string;

  // FSM mode
  fsmProgram: FSMProgram;
  fsmCurrentState: string | null;
  fsmPreviousState?: string | null;
  fsmCurrentTransition?: string | null;
  fsmPhase?: 'idle' | 'transition-matched' | 'executing-action' | 'showing-arrow';
  fsmCurrentActionIndex?: number;

  // ScratchKara mode
  program: CommandType[];
  currentStep: number;

  // Text mode
  textKaraCode: string;

  // Disabled states
  canRun: boolean;
  canStep: boolean;
  canEnd: boolean;
  canSkip: boolean;
}

const MIN_PANEL_WIDTH = 300; // Minimum width in pixels
const MAX_PANEL_RATIO = 0.7; // Maximum ratio of container width

const SideBySideView = ({
  world,
  gridColorTheme,
  viewMode,
  isRunning,
  isFsmRunning,
  isTextKaraRunning,
  executionSpeed,
  onExecutionSpeedChange,
  onRun,
  onPause,
  onStep,
  onEnd,
  onSkip,
  programmingLanguage,
  fsmProgram,
  fsmCurrentState,
  fsmPreviousState = null,
  fsmCurrentTransition = null,
  fsmPhase = 'idle',
  fsmCurrentActionIndex = -1,
  program,
  currentStep,
  textKaraCode,
  canRun,
  canStep,
  canEnd,
  canSkip,
}: SideBySideViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const worldContainerRef = useRef<HTMLDivElement>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // Percentage
  const [isDragging, setIsDragging] = useState(false);

  // Zoom and pan state for world view
  const [zoom, setZoom] = useState(1);
  const [fitZoom, setFitZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const CELL_SIZE = 56;
  const GRID_PADDING = 64;

  // Calculate fit zoom based on container and world size
  const calculateFitZoom = useCallback(() => {
    if (!worldContainerRef.current) return 1;

    const containerWidth = worldContainerRef.current.clientWidth;
    const containerHeight = worldContainerRef.current.clientHeight;

    const gridWidth = world.width * CELL_SIZE + GRID_PADDING;
    const gridHeight = world.height * CELL_SIZE + GRID_PADDING;

    const zoomX = containerWidth / gridWidth;
    const zoomY = containerHeight / gridHeight;
    return Math.min(zoomX, zoomY) * 0.9; // 90% to add some padding
  }, [world.width, world.height]);

  // Initialize and update fit zoom when world size or container changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const newFitZoom = calculateFitZoom();
      setFitZoom(newFitZoom);
      setZoom(newFitZoom);
      setPanOffset({ x: 0, y: 0 });
    }, 100);
    return () => clearTimeout(timer);
  }, [world.width, world.height, leftPanelWidth, calculateFitZoom]);

  // Recalculate fit zoom on window resize
  useEffect(() => {
    const handleResize = () => {
      const newFitZoom = calculateFitZoom();
      setFitZoom(newFitZoom);
      // If current zoom is below new fit, adjust it
      setZoom(prev => Math.max(prev, newFitZoom));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateFitZoom]);

  const handleZoomFit = useCallback(() => {
    const newFitZoom = calculateFitZoom();
    setZoom(newFitZoom);
    setPanOffset({ x: 0, y: 0 });
  }, [calculateFitZoom]);

  // Handle resize drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;

      // Calculate percentage
      let newWidth = (mouseX / containerWidth) * 100;

      // Constrain to min/max
      const minPercent = (MIN_PANEL_WIDTH / containerWidth) * 100;
      const maxPercent = MAX_PANEL_RATIO * 100;

      newWidth = Math.max(minPercent, Math.min(maxPercent, newWidth));
      setLeftPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const isAnyRunning = isRunning || isFsmRunning || isTextKaraRunning;

  return (
    <div
      ref={containerRef}
      className="h-full flex overflow-hidden"
      style={{ cursor: isDragging ? 'col-resize' : 'default' }}
    >
      {/* Left Panel - World View */}
      <div
        className="flex flex-col gap-4 p-4 overflow-hidden min-h-0"
        style={{ width: `${leftPanelWidth}%` }}
      >
        {/* World Display (read-only) with zoom/pan */}
        <Card className="flex-1 overflow-hidden min-h-0 relative">
          {/* Zoom controls */}
          <div className="absolute top-2 right-2 z-10 flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom(prev => Math.min(prev * 1.2, 3))}
              title="Zoom in"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom(prev => Math.max(prev * 0.8, fitZoom))}
              title="Zoom out"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleZoomFit}
              title="Fit to view"
            >
              <Maximize className="h-3 w-3" />
            </Button>
          </div>

          <div
            ref={worldContainerRef}
            className="h-full w-full overflow-hidden"
            onWheel={(e) => {
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
                // Clamp zoom: minimum is fitZoom, maximum is 3
                const clampedZoom = Math.max(fitZoom, Math.min(3, newZoom));

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
            onMouseUp={() => setIsPanning(false)}
            onMouseLeave={() => setIsPanning(false)}
            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          >
            <div
              className="h-full w-full flex items-center justify-center"
              style={{
                transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                transformOrigin: 'center',
                transition: isPanning ? 'none' : 'transform 0.1s',
              }}
            >
              <WorldView
                world={world}
                gridColorTheme={gridColorTheme}
                viewMode={viewMode}
              />
            </div>
          </div>
        </Card>

        {/* Execution Controls */}
        <Card className="p-4 flex-shrink-0">
          <h3 className="text-sm font-semibold mb-3">Execute Program</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button
              onClick={isAnyRunning ? onPause : onRun}
              disabled={!canRun && !isAnyRunning}
              size="sm"
              variant={isAnyRunning ? 'destructive' : 'default'}
              className="gap-1"
            >
              {isAnyRunning ? (
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
              onClick={onStep}
              disabled={!canStep || isAnyRunning}
              size="sm"
              variant="secondary"
              className="gap-1"
            >
              <SkipForward className="h-3 w-3" />
              Step
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button
              onClick={onEnd}
              disabled={!canEnd}
              size="sm"
              variant="outline"
              className="gap-1"
            >
              <Square className="h-3 w-3" />
              End
            </Button>
            <Button
              onClick={onSkip}
              disabled={!canSkip}
              size="sm"
              variant="outline"
              className="gap-1"
            >
              <FastForward className="h-3 w-3" />
              Skip
            </Button>
          </div>

          {/* Execution Speed */}
          <div>
            <h4 className="text-xs font-medium mb-2">Speed</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Slow</span>
              <Slider
                value={[2100 - executionSpeed]}
                onValueChange={(value) => onExecutionSpeedChange(2100 - value[0])}
                min={100}
                max={2000}
                step={100}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground">Fast</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Resize Handle */}
      <div
        className="w-2 bg-border hover:bg-accent cursor-col-resize flex-shrink-0 flex items-center justify-center transition-colors"
        onMouseDown={() => setIsDragging(true)}
      >
        <div className="w-0.5 h-8 bg-muted-foreground/30 rounded-full" />
      </div>

      {/* Right Panel - Program View (read-only) */}
      <div
        className="flex-1 p-4 overflow-hidden"
        style={{ minWidth: `${100 - MAX_PANEL_RATIO * 100}%` }}
      >
        <Card className="h-full p-4 overflow-auto">
          {programmingLanguage === 'Kara' && (
            <FSMReadOnlyView
              program={fsmProgram}
              currentStateId={fsmCurrentState}
              previousStateId={fsmPreviousState}
              executionPhase={fsmPhase}
              currentTransitionId={fsmCurrentTransition}
              currentActionIndex={fsmCurrentActionIndex}
            />
          )}

          {programmingLanguage === 'ScratchKara' && (
            <ScratchKaraReadOnlyView
              program={program}
              currentStep={currentStep}
            />
          )}

          {['JavaKara', 'PythonKara', 'JavaScriptKara', 'RubyKara'].includes(programmingLanguage) && (
            <TextKaraReadOnlyView
              code={textKaraCode}
              language={programmingLanguage as 'JavaKara' | 'PythonKara' | 'JavaScriptKara' | 'RubyKara'}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

// Execution phase type for FSM visualization
type FSMExecutionPhase = 'idle' | 'transition-matched' | 'executing-action' | 'showing-arrow';

// FSM Read-Only View with execution highlighting
const FSMReadOnlyView = ({
  program,
  currentStateId,
  previousStateId: _parentPreviousStateId = null,
  executionPhase: parentExecutionPhase = 'idle',
  currentTransitionId = null,
  currentActionIndex = -1,
}: {
  program: FSMProgram;
  currentStateId: string | null;
  previousStateId?: string | null;
  executionPhase?: FSMExecutionPhase;
  currentTransitionId?: string | null;
  currentActionIndex?: number;
}) => {
  // Zoom state for the diagram
  const [diagramZoom, setDiagramZoom] = useState(1);

  // Use parent execution phase directly
  const executionPhase: FSMExecutionPhase = parentExecutionPhase;

  // Determine what should be highlighted based on parent-controlled phase
  // transition-matched, executing-action: highlight the current state and transition row
  // showing-arrow: highlight the arrow from current to target state
  const isStateActive = executionPhase === 'transition-matched' || executionPhase === 'executing-action' || executionPhase === 'showing-arrow';
  const highlightedStateId = isStateActive ? currentStateId : null;
  const transitionFromState = executionPhase === 'showing-arrow' ? currentStateId : null;
  const transitionToState = executionPhase === 'showing-arrow' ? (
    // Get target state from the current transition
    (() => {
      if (!currentStateId || !currentTransitionId) return null;
      const state = program.states.find(s => s.id === currentStateId);
      const transition = state?.transitions.find(t => t.id === currentTransitionId);
      return transition?.targetStateId || null;
    })()
  ) : null;

  // Calculate bounding box of all states to determine canvas size
  const STATE_RADIUS = 48; // Max radius (stop state)
  const PADDING = 80; // Extra padding around the edges for start arrow and visibility

  const bounds = useMemo(() => {
    if (program.states.length === 0) {
      return { minX: 0, minY: 0, maxX: 400, maxY: 300, width: 400, height: 300 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    program.states.forEach(state => {
      minX = Math.min(minX, state.x - STATE_RADIUS - PADDING);
      minY = Math.min(minY, state.y - STATE_RADIUS - PADDING);
      maxX = Math.max(maxX, state.x + STATE_RADIUS + PADDING);
      maxY = Math.max(maxY, state.y + STATE_RADIUS + PADDING);
    });

    // Ensure minimum dimensions
    const width = Math.max(maxX - minX, 300);
    const height = Math.max(maxY - minY, 200);

    return { minX, minY, maxX, maxY, width, height };
  }, [program.states]);

  // Calculate offset to normalize positions (so canvas starts near 0,0)
  const offsetX = bounds.minX < 0 ? -bounds.minX : 0;
  const offsetY = bounds.minY < 0 ? -bounds.minY : 0;

  const canvasWidth = bounds.width + offsetX;
  const canvasHeight = bounds.height + offsetY;

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-sm font-semibold mb-3 flex-shrink-0">Finite State Machine</h3>

      {/* State Diagram - fixed height to leave room for transitions */}
      <div className="relative bg-muted/20 rounded-lg border-2 border-border flex-shrink-0" style={{ height: '200px' }}>
        {/* Zoom Controls - fixed position within container */}
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
            <Maximize className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground px-1 flex items-center">
            {Math.round(diagramZoom * 100)}%
          </span>
        </div>

        {/* Scrollable Container */}
        <div className="absolute inset-0 overflow-auto">
          {/* Zoomable Content */}
          <div
            className="relative origin-top-left"
            style={{
              width: `${canvasWidth * diagramZoom}px`,
              height: `${canvasHeight * diagramZoom}px`,
              minWidth: '100%',
              minHeight: '100%',
            }}
          >
        <div
          className="relative origin-top-left"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            transform: `scale(${diagramZoom})`,
          }}
        >
          {/* SVG Layer for Transition Arrows */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
          >
            <defs>
              <marker
                id="arrowhead-readonly"
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
                <polygon points="0 0, 10 3, 0 6" fill="currentColor" className="text-green-500" />
              </marker>
              {/* Bidirectional arrow markers (start side) */}
              <marker
                id="arrowhead-start-readonly"
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
                <polygon points="10 0, 0 3, 10 6" fill="currentColor" className="text-green-500" />
              </marker>
            </defs>

            {/* Render arrows between states */}
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

                // Apply offset to state positions
                const stateX = state.x + offsetX;
                const stateY = state.y + offsetY;

                uniqueTargets.forEach((targetId) => {
                  const targetState = program.states.find((s) => s.id === targetId);
                  if (!targetState) return;

                  const targetX = targetState.x + offsetX;
                  const targetY = targetState.y + offsetY;

                  const sourceRadius = state.id === program.stopStateId ? 48 : 40;
                  const targetRadius = targetState.id === program.stopStateId ? 48 : 40;

                  // Self-loop (always render)
                  if (state.id === targetId) {
                    const isArrowHighlighted = executionPhase === 'showing-arrow' &&
                      transitionFromState === state.id &&
                      transitionToState === targetId;

                    // Create a smooth circular self-loop using cubic bezier
                    const loopSize = 30;
                    const startAngle = -Math.PI / 2 - 0.5;
                    const endAngle = -Math.PI / 2 + 0.5;
                    const startX = stateX + sourceRadius * Math.cos(startAngle);
                    const startY = stateY + sourceRadius * Math.sin(startAngle);
                    const endX = stateX + sourceRadius * Math.cos(endAngle);
                    const endY = stateY + sourceRadius * Math.sin(endAngle);

                    // Control points for a smooth arc
                    const ctrl1X = startX - loopSize * 0.5;
                    const ctrl1Y = startY - loopSize;
                    const ctrl2X = endX + loopSize * 0.5;
                    const ctrl2Y = endY - loopSize;

                    // Calculate arrowhead direction from the curve's end tangent
                    const arrowAngle = Math.atan2(endY - ctrl2Y, endX - ctrl2X);
                    const arrowSize = 6;

                    arrows.push(
                      <g key={`${state.id}-${targetId}`}>
                        <path
                          d={`M ${startX} ${startY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${endX} ${endY}`}
                          fill="none"
                          stroke={isArrowHighlighted ? 'rgb(34, 197, 94)' : 'currentColor'}
                          strokeWidth={isArrowHighlighted ? 3 : 2}
                          className={isArrowHighlighted ? '' : 'text-foreground'}
                        />
                        <polygon
                          points={`${endX},${endY} ${endX - arrowSize * Math.cos(arrowAngle - 0.5)},${endY - arrowSize * Math.sin(arrowAngle - 0.5)} ${endX - arrowSize * Math.cos(arrowAngle + 0.5)},${endY - arrowSize * Math.sin(arrowAngle + 0.5)}`}
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
                    const isForwardHighlighted = executionPhase === 'showing-arrow' &&
                      transitionFromState === state.id &&
                      transitionToState === targetId;
                    const isReverseHighlighted = executionPhase === 'showing-arrow' &&
                      transitionFromState === targetId &&
                      transitionToState === state.id;
                    const isHighlighted = isForwardHighlighted || isReverseHighlighted;

                    // Calculate arrow geometry
                    const dx = targetX - stateX;
                    const dy = targetY - stateY;
                    const angle = Math.atan2(dy, dx);

                    const startX = stateX + Math.cos(angle) * (sourceRadius + 8);
                    const startY = stateY + Math.sin(angle) * (sourceRadius + 8);
                    const endX = targetX - Math.cos(angle) * (targetRadius + 8);
                    const endY = targetY - Math.sin(angle) * (targetRadius + 8);

                    arrows.push(
                      <line
                        key={`bidirectional-${pairKey}`}
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke={isHighlighted ? 'rgb(34, 197, 94)' : 'currentColor'}
                        strokeWidth={isHighlighted ? 3 : 2}
                        markerStart={isHighlighted ? 'url(#arrowhead-start-active)' : 'url(#arrowhead-start-readonly)'}
                        markerEnd={isHighlighted ? 'url(#arrowhead-active)' : 'url(#arrowhead-readonly)'}
                        className={isHighlighted ? '' : 'text-foreground'}
                      />
                    );
                  } else {
                    // Unidirectional arrow
                    const isArrowHighlighted = executionPhase === 'showing-arrow' &&
                      transitionFromState === state.id &&
                      transitionToState === targetId;

                    const dx = targetX - stateX;
                    const dy = targetY - stateY;
                    const angle = Math.atan2(dy, dx);

                    const startX = stateX + Math.cos(angle) * sourceRadius;
                    const startY = stateY + Math.sin(angle) * sourceRadius;
                    const endX = targetX - Math.cos(angle) * (targetRadius + 8);
                    const endY = targetY - Math.sin(angle) * (targetRadius + 8);

                    arrows.push(
                      <line
                        key={`${state.id}-${targetId}`}
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke={isArrowHighlighted ? 'rgb(34, 197, 94)' : 'currentColor'}
                        strokeWidth={isArrowHighlighted ? 3 : 2}
                        className={isArrowHighlighted ? '' : 'text-foreground'}
                        markerEnd={isArrowHighlighted ? 'url(#arrowhead-active)' : 'url(#arrowhead-readonly)'}
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
            const isStartState = state.id === program.startStateId;

            // Use highlightedStateId for state highlighting instead of currentStateId
            const isStateHighlighted = highlightedStateId === state.id;

            // Check if start arrow should be highlighted (when transitioning to start state from idle)
            const isStartArrowHighlighted = isStartState && executionPhase === 'showing-arrow' && transitionFromState === null;

            // Apply offset to state positions
            const stateX = state.x + offsetX;
            const stateY = state.y + offsetY;

            return (
              <div
                key={state.id}
                className="absolute"
                style={{
                  left: `${stateX}px`,
                  top: `${stateY}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Start Arrow */}
                {isStartState && (
                  <div
                    className="absolute flex items-center pointer-events-none"
                    style={{
                      right: '100%',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      marginRight: '4px',
                    }}
                  >
                    <div className={`w-8 h-0.5 ${isStartArrowHighlighted ? 'bg-green-500' : 'bg-foreground'} transition-colors duration-200`} />
                    <div
                      className={`w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] ${isStartArrowHighlighted ? 'border-l-green-500' : 'border-l-foreground'} transition-colors duration-200`}
                    />
                  </div>
                )}

                {/* State Circle */}
                <div
                  className={`
                    flex items-center justify-center rounded-full font-medium
                    transition-all duration-200
                    ${isStopState ? 'w-24 h-24 bg-destructive/20 border-4 border-destructive' : 'w-20 h-20 border-2'}
                    ${isStateHighlighted && !isStopState ? 'bg-green-500/20 border-green-500 ring-4 ring-green-500/30 scale-110' : ''}
                    ${!isStateHighlighted && !isStopState ? 'bg-secondary border-border' : ''}
                  `}
                >
                  <span
                    className={`text-center px-1 overflow-hidden leading-tight ${isStopState ? 'text-destructive font-bold' : ''}`}
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

      {/* Current State Info */}
      {currentStateId && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex-shrink-0">
          <p className="text-sm">
            <span className="font-medium">
              {executionPhase === 'showing-arrow' && 'Transitioning to: '}
              {executionPhase === 'transition-matched' && 'Transition Matched: '}
              {executionPhase === 'executing-action' && 'Executing Action: '}
              {executionPhase === 'idle' && 'Current State: '}
            </span>
            <span className="text-green-600 dark:text-green-400 font-bold">
              {program.states.find(s => s.id === currentStateId)?.name || currentStateId}
            </span>
          </p>
        </div>
      )}

      {/* Transitions Panel - shows transitions from the relevant state */}
      {(() => {
        // Determine which state's transitions to show
        // For all phases, show transitions from the current state
        const displayStateId = currentStateId;
        const displayState = program.states.find(s => s.id === displayStateId);

        if (!displayState || displayStateId === program.stopStateId) return null;

        const transitions = displayState.transitions || [];
        if (transitions.length === 0) return null;

        // Detector titles for accessibility
        const detectorTitles: Record<string, string> = {
          treeFront: 'Tree in front',
          treeLeft: 'Tree to left',
          treeRight: 'Tree to right',
          mushroomFront: 'Mushroom in front',
          onLeaf: 'On clover',
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
          <div className="mt-4 flex-1 min-h-0 flex flex-col">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex-shrink-0">
              Transitions in "{displayState.name}"
            </h4>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {transitions.map((transition) => {
                const isRowExecuting = currentTransitionId === transition.id &&
                  (executionPhase === 'transition-matched' || executionPhase === 'executing-action');
                const isRowTransitioning = currentTransitionId === transition.id &&
                  executionPhase === 'showing-arrow';
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
                      <div className="flex gap-1 flex-wrap items-center">
                        {Object.entries(transition.detectorConditions).map(([detector, value]) => {
                          if (value === null) return null;
                          return (
                            <div
                              key={detector}
                              className="flex items-center gap-0.5 px-1 py-0.5 bg-background rounded border border-border"
                              title={`${detectorTitles[detector]}: ${value ? 'yes' : 'no'}`}
                            >
                              <DetectorIcon type={detector as 'treeFront' | 'treeLeft' | 'treeRight' | 'mushroomFront' | 'onLeaf'} size={24} />
                              <span className="text-xs font-medium">{value ? '✓' : '✗'}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Arrow separator */}
                      <span className="text-muted-foreground">→</span>

                      {/* Actions with individual highlighting */}
                      <div className="flex gap-1">
                        {transition.actions.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">no actions</span>
                        ) : (
                          transition.actions.map((action, idx) => {
                            // Check if this specific action is being executed
                            const isActionExecuting =
                              isRowExecuting &&
                              executionPhase === 'executing-action' &&
                              idx === currentActionIndex;

                            // Check if this action has already been executed
                            const isActionCompleted =
                              isRowExecuting &&
                              executionPhase === 'executing-action' &&
                              idx < currentActionIndex;

                            // Check if action is pending
                            const isActionPending =
                              isRowExecuting &&
                              (executionPhase === 'transition-matched' ||
                               (executionPhase === 'executing-action' && idx > currentActionIndex));

                            return (
                              <span
                                key={idx}
                                className={`relative text-lg px-1 rounded transition-all ${
                                  isActionExecuting
                                    ? 'bg-green-500/30 ring-2 ring-green-500/50 scale-110'
                                    : isActionCompleted
                                    ? 'opacity-50'
                                    : isActionPending
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30'
                                    : ''
                                }`}
                                title={action.type}
                              >
                                {getActionIcon(action.type)}
                                {isActionExecuting && (
                                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                                )}
                              </span>
                            );
                          })
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
          </div>
        );
      })()}
    </div>
  );
};

// ScratchKara Read-Only View with step highlighting
const ScratchKaraReadOnlyView = ({
  program,
  currentStep,
}: {
  program: CommandType[];
  currentStep: number;
}) => {
  const getCommandIcon = (type: CommandType) => {
    switch (type) {
      case CommandType.MoveForward: return '\u2191';
      case CommandType.TurnLeft: return '\u21B6';
      case CommandType.TurnRight: return '\u21B7';
      case CommandType.PickClover: return '\uD83C\uDF40';
      case CommandType.PlaceClover: return '\u2B07\uFE0F';
    }
  };

  const getCommandLabel = (type: CommandType) => {
    switch (type) {
      case CommandType.MoveForward: return 'Move Forward';
      case CommandType.TurnLeft: return 'Turn Left';
      case CommandType.TurnRight: return 'Turn Right';
      case CommandType.PickClover: return 'Pick Clover';
      case CommandType.PlaceClover: return 'Place Clover';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-sm font-semibold mb-3">Program Commands</h3>

      {program.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          No commands in program
        </div>
      ) : (
        <div className="flex-1 overflow-auto space-y-2">
          {program.map((cmd, index) => (
            <div
              key={index}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200
                ${index === currentStep
                  ? 'bg-green-500/20 border-green-500 ring-2 ring-green-500/30 scale-[1.02]'
                  : 'bg-card border-border'
                }
                ${index < currentStep ? 'opacity-50' : ''}
              `}
            >
              <span className="text-xs text-muted-foreground font-mono w-6">
                {index + 1}.
              </span>
              <span className="text-xl">{getCommandIcon(cmd)}</span>
              <span className="font-medium">{getCommandLabel(cmd)}</span>
              {index === currentStep && (
                <span className="ml-auto text-xs text-green-600 dark:text-green-400 font-medium">
                  Executing
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Text-based Kara Read-Only View
const TextKaraReadOnlyView = ({
  code,
  language,
}: {
  code: string;
  language: 'JavaKara' | 'PythonKara' | 'JavaScriptKara' | 'RubyKara';
}) => {
  const lines = code.split('\n');

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-sm font-semibold mb-3">{language} Code</h3>

      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 rounded-lg border font-mono text-sm">
        <div className="flex">
          {/* Line numbers */}
          <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 px-3 py-2 select-none">
            {lines.map((_, index) => (
              <div
                key={index}
                className="text-gray-500 dark:text-gray-400 text-right leading-6"
                style={{ height: '24px' }}
              >
                {index + 1}
              </div>
            ))}
          </div>

          {/* Code content */}
          <div className="flex-1 py-2 px-3 overflow-x-auto">
            {lines.map((line, index) => (
              <div
                key={index}
                className="leading-6 whitespace-pre"
                style={{ height: '24px' }}
              >
                {line || ' '}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideBySideView;
