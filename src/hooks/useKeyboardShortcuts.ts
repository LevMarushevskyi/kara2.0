import { useEffect } from 'react';

export interface KeyboardShortcuts {
  onRun?: () => void;
  onPause?: () => void;
  onStep?: () => void;
  onReset?: () => void;
  onClear?: () => void;
  onSave?: () => void;
  onRepeat?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

/**
 * Custom hook for keyboard shortcuts in Kara application
 *
 * Shortcuts:
 * - Space: Run/Pause program
 * - S: Step through program
 * - R: Reset world
 * - C: Clear program
 * - L: Repeat pattern (Loop)
 * - Ctrl/Cmd + S: Save/Export
 * - Ctrl/Cmd + Z: Undo
 * - Ctrl/Cmd + Y (or Ctrl/Cmd + Shift + Z): Redo
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + S - Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        shortcuts.onSave?.();
        return;
      }

      // Ctrl/Cmd + Z - Undo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        shortcuts.onUndo?.();
        return;
      }

      // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z - Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        shortcuts.onRedo?.();
        return;
      }

      // Don't handle other shortcuts if modifier keys are pressed
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'spacebar':
          e.preventDefault();
          shortcuts.onRun?.();
          break;
        case 'p':
          e.preventDefault();
          shortcuts.onPause?.();
          break;
        case 's':
          e.preventDefault();
          shortcuts.onStep?.();
          break;
        case 'r':
          e.preventDefault();
          shortcuts.onReset?.();
          break;
        case 'c':
          e.preventDefault();
          shortcuts.onClear?.();
          break;
        case 'l':
          e.preventDefault();
          shortcuts.onRepeat?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
