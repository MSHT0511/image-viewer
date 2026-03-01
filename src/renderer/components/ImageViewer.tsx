interface ImageViewerProps {
  imageSrc: string | null;
  scale: number;
  position: { x: number; y: number };
  isLoading: boolean;
  error: string | null;
  onWheel?: (e: React.WheelEvent<HTMLDivElement>) => void;
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDoubleClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  isDragging?: boolean;
}

export function ImageViewer({ imageSrc, scale, position, isLoading, error, onWheel, onMouseDown, onDoubleClick, isDragging }: ImageViewerProps) {
  console.log('🎨 [ImageViewer] Render:', {
    hasImageSrc: !!imageSrc,
    imageSrcLength: imageSrc?.length,
    isLoading,
    error,
    scale
  });

  if (isLoading) {
    return (
      <div className="image-viewer">
        <div className="loading-message">画像を読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="image-viewer">
        <div className="error-message">エラー: {error}</div>
      </div>
    );
  }

  if (!imageSrc) {
    return (
      <div className="image-viewer">
        <div className="empty-message">
          画像を開くには、ファイルを選択するかドラッグ＆ドロップしてください
        </div>
      </div>
    );
  }

  return (
    <div
      className={`image-viewer ${isDragging ? 'dragging' : ''}`}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
    >
      <div
        className={`image-container ${isDragging ? 'dragging' : ''}`}
        style={{
          transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
        }}
      >
        <img src={imageSrc} alt="Viewer" />
      </div>
    </div>
  );
}
