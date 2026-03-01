import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onNext: () => void;
  onPrev: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onOpenFile: () => void;
  onOpenFolder: () => void;
}

export function useKeyboardShortcuts({
  onNext,
  onPrev,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onOpenFile,
  onOpenFolder,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Navigation
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      }
      // Zoom
      else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        onZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        onZoomOut();
      } else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onZoomReset();
      }
      // File operations
      else if (e.key === 'o' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        onOpenFile();
      } else if (e.key === 'O' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        onOpenFolder();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onZoomIn, onZoomOut, onZoomReset, onOpenFile, onOpenFolder]);
}
