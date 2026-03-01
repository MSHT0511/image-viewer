import { useState, useCallback } from 'react';

const MIN_SCALE = 0.1;
const MAX_SCALE = 10;
const ZOOM_FACTOR = 1.2;

export function useZoom() {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev * ZOOM_FACTOR, MAX_SCALE));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev / ZOOM_FACTOR, MIN_SCALE));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const zoomAtPoint = useCallback(
    (deltaY: number, mouseX: number, mouseY: number, containerRect: DOMRect) => {
      // Determine zoom direction
      const zoomIn = deltaY < 0;
      const factor = zoomIn ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;

      setScale((prevScale) => {
        const newScale = zoomIn
          ? Math.min(prevScale * factor, MAX_SCALE)
          : Math.max(prevScale * factor, MIN_SCALE);

        // If scale doesn't change (hit limit), don't update position
        if (newScale === prevScale) {
          return prevScale;
        }

        // Calculate mouse position relative to container center
        const containerCenterX = containerRect.width / 2;
        const containerCenterY = containerRect.height / 2;
        const mouseOffsetX = mouseX - containerRect.left - containerCenterX;
        const mouseOffsetY = mouseY - containerRect.top - containerCenterY;

        // Calculate new position to keep the point under cursor stationary
        setPosition((prevPosition) => {
          const scaleFactor = newScale / prevScale;
          return {
            x: prevPosition.x - (mouseOffsetX * (scaleFactor - 1)) / newScale,
            y: prevPosition.y - (mouseOffsetY * (scaleFactor - 1)) / newScale,
          };
        });

        return newScale;
      });
    },
    []
  );

  return {
    scale,
    position,
    zoomIn,
    zoomOut,
    resetZoom,
    zoomAtPoint,
    setPosition,
  };
}
