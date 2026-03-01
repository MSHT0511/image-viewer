interface NavigationControlsProps {
  onPrev: () => void;
  onNext: () => void;
  hasImages: boolean;
}

export function NavigationControls({ onPrev, onNext, hasImages }: NavigationControlsProps) {
  return (
    <div className="navigation-controls">
      <button
        onClick={onPrev}
        className="control-button"
        disabled={!hasImages}
        title="前の画像 (←)"
      >
        ← 前へ
      </button>
      <button
        onClick={onNext}
        className="control-button"
        disabled={!hasImages}
        title="次の画像 (→)"
      >
        次へ →
      </button>
    </div>
  );
}
