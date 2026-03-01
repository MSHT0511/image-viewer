interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function ZoomControls({ scale, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
  return (
    <div className="zoom-controls">
      <button onClick={onZoomOut} className="control-button" title="ズームアウト (-)">
        -
      </button>
      <button onClick={onReset} className="control-button zoom-percentage" title="リセット (Ctrl+0)">
        {Math.round(scale * 100)}%
      </button>
      <button onClick={onZoomIn} className="control-button" title="ズームイン (+)">
        +
      </button>
    </div>
  );
}
