import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageViewer } from '@renderer/components/ImageViewer';

describe('ImageViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with no image', () => {
    const { container } = render(
      <ImageViewer
        imageSrc={null}
        scale={1}
        position={{ x: 0, y: 0 }}
        isLoading={false}
        error={null}
      />
    );

    expect(container.querySelector('.image-viewer')).toBeInTheDocument();
    expect(screen.getByText(/画像を開くには/)).toBeInTheDocument();
  });

  it('should display error message when error occurs', () => {
    render(
      <ImageViewer
        imageSrc={null}
        scale={1}
        position={{ x: 0, y: 0 }}
        isLoading={false}
        error="Failed to load image"
      />
    );

    expect(screen.getByText(/Failed to load image/)).toBeInTheDocument();
  });

  it('should display loading state', () => {
    render(
      <ImageViewer
        imageSrc="test.jpg"
        scale={1}
        position={{ x: 0, y: 0 }}
        isLoading={true}
        error={null}
      />
    );

    expect(screen.getByText(/画像を読み込み中/)).toBeInTheDocument();
  });

  it('should render image with correct transform', () => {
    const { container } = render(
      <ImageViewer
        imageSrc="data:image/png;base64,test"
        scale={1.5}
        position={{ x: 10, y: 20 }}
        isLoading={false}
        error={null}
      />
    );

    const imageContainer = container.querySelector('.image-container');
    expect(imageContainer).toBeInTheDocument();

    const style = imageContainer?.getAttribute('style');
    expect(style).toContain('translate(10px, 20px)');
    expect(style).toContain('scale(1.5)');
  });

  it('should call onWheel when wheel event occurs', () => {
    const mockOnWheel = vi.fn();
    const { container } = render(
      <ImageViewer
        imageSrc="test.jpg"
        scale={1}
        position={{ x: 0, y: 0 }}
        isLoading={false}
        error={null}
        onWheel={mockOnWheel}
      />
    );

    const viewer = container.querySelector('.image-viewer');
    expect(viewer).toBeInTheDocument();

    if (viewer) {
      fireEvent.wheel(viewer);
      expect(mockOnWheel).toHaveBeenCalled();
    }
  });

  it('should call onMouseDown when mouse is pressed', () => {
    const mockOnMouseDown = vi.fn();
    const { container } = render(
      <ImageViewer
        imageSrc="test.jpg"
        scale={1}
        position={{ x: 0, y: 0 }}
        isLoading={false}
        error={null}
        onMouseDown={mockOnMouseDown}
      />
    );

    const viewer = container.querySelector('.image-viewer');
    expect(viewer).toBeInTheDocument();

    if (viewer) {
      fireEvent.mouseDown(viewer);
      expect(mockOnMouseDown).toHaveBeenCalled();
    }
  });
});
