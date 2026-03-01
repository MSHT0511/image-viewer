import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '@renderer/hooks/useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  const mockCallbacks = {
    onNext: vi.fn(),
    onPrev: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onZoomReset: vi.fn(),
    onOpenFile: vi.fn(),
    onOpenFolder: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call onNext when ArrowRight is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    window.dispatchEvent(event);

    expect(mockCallbacks.onNext).toHaveBeenCalledOnce();
  });

  it('should call onNext when Space is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: ' ' });
    window.dispatchEvent(event);

    expect(mockCallbacks.onNext).toHaveBeenCalledOnce();
  });

  it('should call onPrev when ArrowLeft is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    window.dispatchEvent(event);

    expect(mockCallbacks.onPrev).toHaveBeenCalledOnce();
  });

  it('should call onZoomIn when + is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: '+' });
    window.dispatchEvent(event);

    expect(mockCallbacks.onZoomIn).toHaveBeenCalledOnce();
  });

  it('should call onZoomIn when = is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: '=' });
    window.dispatchEvent(event);

    expect(mockCallbacks.onZoomIn).toHaveBeenCalledOnce();
  });

  it('should call onZoomOut when - is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: '-' });
    window.dispatchEvent(event);

    expect(mockCallbacks.onZoomOut).toHaveBeenCalledOnce();
  });

  it('should call onZoomReset when Ctrl+0 is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: '0', ctrlKey: true });
    window.dispatchEvent(event);

    expect(mockCallbacks.onZoomReset).toHaveBeenCalledOnce();
  });

  it('should call onZoomReset when Cmd+0 is pressed (macOS)', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: '0', metaKey: true });
    window.dispatchEvent(event);

    expect(mockCallbacks.onZoomReset).toHaveBeenCalledOnce();
  });

  it('should call onOpenFile when Ctrl+o is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: 'o', ctrlKey: true });
    window.dispatchEvent(event);

    expect(mockCallbacks.onOpenFile).toHaveBeenCalledOnce();
  });

  it('should call onOpenFolder when Ctrl+Shift+O is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: 'O', ctrlKey: true, shiftKey: true });
    window.dispatchEvent(event);

    expect(mockCallbacks.onOpenFolder).toHaveBeenCalledOnce();
  });

  it('should not call onOpenFile when Ctrl+Shift+O is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: 'O', ctrlKey: true, shiftKey: true });
    window.dispatchEvent(event);

    expect(mockCallbacks.onOpenFile).not.toHaveBeenCalled();
  });

  it('should cleanup event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useKeyboardShortcuts(mockCallbacks));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should not trigger shortcuts for unhandled keys', () => {
    renderHook(() => useKeyboardShortcuts(mockCallbacks));

    const event = new KeyboardEvent('keydown', { key: 'a' });
    window.dispatchEvent(event);

    expect(mockCallbacks.onNext).not.toHaveBeenCalled();
    expect(mockCallbacks.onPrev).not.toHaveBeenCalled();
    expect(mockCallbacks.onZoomIn).not.toHaveBeenCalled();
    expect(mockCallbacks.onZoomOut).not.toHaveBeenCalled();
  });
});
