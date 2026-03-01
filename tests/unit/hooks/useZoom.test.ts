import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useZoom } from '@renderer/hooks/useZoom';

describe('useZoom', () => {
  describe('Initial state', () => {
    it('should initialize with scale 1 and position (0, 0)', () => {
      const { result } = renderHook(() => useZoom());

      expect(result.current.scale).toBe(1);
      expect(result.current.position).toEqual({ x: 0, y: 0 });
    });
  });

  describe('zoomIn', () => {
    it('should increase scale by ZOOM_FACTOR (1.2)', () => {
      const { result } = renderHook(() => useZoom());

      act(() => {
        result.current.zoomIn();
      });

      expect(result.current.scale).toBe(1.2);
    });

    it('should cap scale at MAX_SCALE (10)', () => {
      const { result } = renderHook(() => useZoom());

      // Zoom in many times
      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.zoomIn();
        }
      });

      expect(result.current.scale).toBe(10);
    });
  });

  describe('zoomOut', () => {
    it('should decrease scale by ZOOM_FACTOR (1.2)', () => {
      const { result } = renderHook(() => useZoom());

      act(() => {
        result.current.zoomOut();
      });

      expect(result.current.scale).toBeCloseTo(1 / 1.2, 5);
    });

    it('should cap scale at MIN_SCALE (0.1)', () => {
      const { result } = renderHook(() => useZoom());

      // Zoom out many times
      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.zoomOut();
        }
      });

      expect(result.current.scale).toBe(0.1);
    });
  });

  describe('resetZoom', () => {
    it('should reset scale to 1 and position to (0, 0)', () => {
      const { result } = renderHook(() => useZoom());

      act(() => {
        result.current.zoomIn();
        result.current.zoomIn();
        result.current.setPosition({ x: 100, y: 200 });
      });

      expect(result.current.scale).not.toBe(1);
      expect(result.current.position).not.toEqual({ x: 0, y: 0 });

      act(() => {
        result.current.resetZoom();
      });

      expect(result.current.scale).toBe(1);
      expect(result.current.position).toEqual({ x: 0, y: 0 });
    });
  });

  describe('setPosition', () => {
    it('should set position to specified coordinates', () => {
      const { result } = renderHook(() => useZoom());

      act(() => {
        result.current.setPosition({ x: 50, y: 100 });
      });

      expect(result.current.position).toEqual({ x: 50, y: 100 });
    });
  });

  describe('zoomAtPoint', () => {
    it('should zoom in when deltaY is negative', () => {
      const { result } = renderHook(() => useZoom());
      const mockRect: DOMRect = {
        width: 800,
        height: 600,
        left: 0,
        top: 0,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };

      act(() => {
        result.current.zoomAtPoint(-100, 400, 300, mockRect);
      });

      expect(result.current.scale).toBe(1.2);
    });

    it('should zoom out when deltaY is positive', () => {
      const { result } = renderHook(() => useZoom());
      const mockRect: DOMRect = {
        width: 800,
        height: 600,
        left: 0,
        top: 0,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };

      act(() => {
        result.current.zoomIn(); // Set initial scale to 1.2
      });

      act(() => {
        result.current.zoomAtPoint(100, 400, 300, mockRect);
      });

      expect(result.current.scale).toBe(1); // Back to 1
    });

    it('should not change scale when hitting MAX_SCALE limit', () => {
      const { result } = renderHook(() => useZoom());
      const mockRect: DOMRect = {
        width: 800,
        height: 600,
        left: 0,
        top: 0,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };

      // Zoom to max
      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.zoomIn();
        }
      });

      const maxScale = result.current.scale;

      // Try to zoom more
      act(() => {
        result.current.zoomAtPoint(-100, 400, 300, mockRect);
      });

      expect(result.current.scale).toBe(maxScale);
    });

    it('should not change scale when hitting MIN_SCALE limit', () => {
      const { result } = renderHook(() => useZoom());
      const mockRect: DOMRect = {
        width: 800,
        height: 600,
        left: 0,
        top: 0,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };

      // Zoom to min
      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.zoomOut();
        }
      });

      const minScale = result.current.scale;

      // Try to zoom out more
      act(() => {
        result.current.zoomAtPoint(100, 400, 300, mockRect);
      });

      expect(result.current.scale).toBe(minScale);
    });

    it('should calculate position correctly when zooming at center', () => {
      const { result } = renderHook(() => useZoom());
      const mockRect: DOMRect = {
        width: 800,
        height: 600,
        left: 0,
        top: 0,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };

      // Zoom at center (400, 300)
      act(() => {
        result.current.zoomAtPoint(-100, 400, 300, mockRect);
      });

      // Position should remain (0, 0) when zooming at center
      expect(result.current.position).toEqual({ x: 0, y: 0 });
    });

    it('should calculate position correctly when zooming at offset point', () => {
      const { result } = renderHook(() => useZoom());
      const mockRect: DOMRect = {
        width: 800,
        height: 600,
        left: 0,
        top: 0,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };

      // Zoom at offset point (500, 400)
      act(() => {
        result.current.zoomAtPoint(-100, 500, 400, mockRect);
      });

      // Position should change to keep the point stationary
      expect(result.current.position.x).not.toBe(0);
      expect(result.current.position.y).not.toBe(0);
    });
  });
});
