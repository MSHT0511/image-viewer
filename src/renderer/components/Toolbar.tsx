interface ToolbarProps {
  currentFileName: string | null;
  currentIndex: number;
  totalImages: number;
  onOpenFile: () => void;
  onOpenFolder: () => void;
}

export function Toolbar({
  currentFileName,
  currentIndex,
  totalImages,
  onOpenFile,
  onOpenFolder,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button onClick={onOpenFile} className="toolbar-button">
          ファイルを開く
        </button>
        <button onClick={onOpenFolder} className="toolbar-button">
          フォルダを開く
        </button>
      </div>
      <div className="toolbar-center">
        {currentFileName && (
          <>
            <span className="file-name">{currentFileName}</span>
            <span className="image-count">
              {totalImages > 0 ? `${currentIndex + 1} / ${totalImages}` : ''}
            </span>
          </>
        )}
      </div>
      <div className="toolbar-right"></div>
    </div>
  );
}
