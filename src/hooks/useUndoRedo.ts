import { useState, useCallback } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseUndoRedoReturn<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

/**
 * Custom hook for managing undo/redo functionality
 * @param initialState - The initial state value
 * @returns Object with state, setState, undo, redo, and history status
 */
export function useUndoRedo<T>(initialState: T): UseUndoRedoReturn<T> {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    setHistory((currentHistory) => {
      const actualNewState =
        typeof newState === 'function'
          ? (newState as (prev: T) => T)(currentHistory.present)
          : newState;

      // Don't add to history if the state hasn't changed
      if (JSON.stringify(actualNewState) === JSON.stringify(currentHistory.present)) {
        return currentHistory;
      }

      return {
        past: [...currentHistory.past, currentHistory.present],
        present: actualNewState,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((currentHistory) => {
      if (currentHistory.past.length === 0) return currentHistory;

      const previous = currentHistory.past[currentHistory.past.length - 1];
      const newPast = currentHistory.past.slice(0, currentHistory.past.length - 1);

      return {
        past: newPast,
        present: previous,
        future: [currentHistory.present, ...currentHistory.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((currentHistory) => {
      if (currentHistory.future.length === 0) return currentHistory;

      const next = currentHistory.future[0];
      const newFuture = currentHistory.future.slice(1);

      return {
        past: [...currentHistory.past, currentHistory.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory((currentHistory) => ({
      past: [],
      present: currentHistory.present,
      future: [],
    }));
  }, []);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    clearHistory,
  };
}
