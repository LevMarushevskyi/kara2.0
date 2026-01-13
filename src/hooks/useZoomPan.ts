import { useState, useCallback, useEffect } from 'react';

interface ZoomPanState {
  zoom: number;
  fitZoom: number;
  panOffset: { x: number; y: number };
  isPanning: boolean;
  panStart: { x: number; y: number };
}

interface UseZoomPanOptions {
  worldWidth: number;
  worldHeight: number;
  cellSize?: number;
  baselineGridSize?: number;
  gridPadding?: number;
}

interface UseZoomPanReturn extends ZoomPanState {
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  setIsPanning: (isPanning: boolean) => void;
  setPanStart: (start: { x: number; y: number }) => void;
  calculateFitZoom: () => number;
  calculateBaselineZoom: () => number;
  getZoomPercentage: () => number;
  isAtFitZoom: boolean;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleZoomFit: () => void;
  handleZoom100: () => void;
}

export function useZoomPan({
  worldWidth,
  worldHeight,
  cellSize = 56,
  baselineGridSize = 9,
  gridPadding = 64,
}: UseZoomPanOptions): UseZoomPanReturn {
  const [zoom, setZoom] = useState(1);
  const [fitZoom, setFitZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const calculateFitZoom = useCallback(() => {
    const container = document.querySelector('[role="region"][aria-label="World view"]');
    if (!container) return 1;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const gridWidth = worldWidth * cellSize + gridPadding;
    const gridHeight = worldHeight * cellSize + gridPadding;

    const zoomX = containerWidth / gridWidth;
    const zoomY = containerHeight / gridHeight;
    return Math.min(zoomX, zoomY) * 0.88;
  }, [worldWidth, worldHeight, cellSize, gridPadding]);

  const calculateBaselineZoom = useCallback(() => {
    const container = document.querySelector('[role="region"][aria-label="World view"]');
    if (!container) return 1;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const baselineGridWidth = baselineGridSize * cellSize + gridPadding;
    const baselineGridHeight = baselineGridSize * cellSize + gridPadding;

    const zoomX = containerWidth / baselineGridWidth;
    const zoomY = containerHeight / baselineGridHeight;
    return Math.min(zoomX, zoomY) * 0.88;
  }, [baselineGridSize, cellSize, gridPadding]);

  const getZoomPercentage = useCallback(() => {
    const baselineZoom = calculateBaselineZoom();
    if (baselineZoom === 0) return 100;
    return Math.round((zoom / baselineZoom) * 100);
  }, [zoom, calculateBaselineZoom]);

  // Update fit zoom when grid size changes and auto-zoom to fit
  useEffect(() => {
    const timer = setTimeout(() => {
      const newFitZoom = calculateFitZoom();
      setFitZoom(newFitZoom);
      setZoom(newFitZoom);
      setPanOffset({ x: 0, y: 0 });
    }, 50);
    return () => clearTimeout(timer);
  }, [worldWidth, worldHeight, calculateFitZoom]);

  // Handle window resize - ensure zoom doesn't fall below fitZoom when window grows
  useEffect(() => {
    const handleResize = () => {
      const newFitZoom = calculateFitZoom();
      setFitZoom(newFitZoom);
      // If current zoom is below new fitZoom, adjust it up
      setZoom((prev) => Math.max(prev, newFitZoom));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateFitZoom]);

  const isAtFitZoom = Math.abs(zoom - fitZoom) < 0.01;

  const handleZoomIn = useCallback(() => {
    const baselineZoom = calculateBaselineZoom();
    setZoom((prev) => Math.min(prev + baselineZoom * 0.25, baselineZoom * 3));
  }, [calculateBaselineZoom]);

  const handleZoomOut = useCallback(() => {
    const baselineZoom = calculateBaselineZoom();
    const currentFitZoom = calculateFitZoom();
    setZoom((prev) => Math.max(prev - baselineZoom * 0.25, currentFitZoom));
  }, [calculateBaselineZoom, calculateFitZoom]);

  const handleZoomFit = useCallback(() => {
    const newFitZoom = calculateFitZoom();
    setZoom(newFitZoom);
    setPanOffset({ x: 0, y: 0 });
  }, [calculateFitZoom]);

  const handleZoom100 = useCallback(() => {
    const baselineZoom = calculateBaselineZoom();
    setZoom(baselineZoom);
    setPanOffset({ x: 0, y: 0 });
  }, [calculateBaselineZoom]);

  return {
    zoom,
    fitZoom,
    panOffset,
    isPanning,
    panStart,
    setZoom,
    setPanOffset,
    setIsPanning,
    setPanStart,
    calculateFitZoom,
    calculateBaselineZoom,
    getZoomPercentage,
    isAtFitZoom,
    handleZoomIn,
    handleZoomOut,
    handleZoomFit,
    handleZoom100,
  };
}
