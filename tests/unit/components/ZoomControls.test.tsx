import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ZoomControls } from '@renderer/components/ZoomControls';

describe('ZoomControls', () => {
  const mockOnZoomIn = vi.fn();
  const mockOnZoomOut = vi.fn();
  const mockOnReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render zoom controls with current scale', () => {
    render(
      <ZoomControls
        scale={1.5}
        onZoomIn={mockOnZoomIn}
        onZoomOut={mockOnZoomOut}
        onReset={mockOnReset}
      />
    );

    expect(screen.getByText('150%')).toBeInTheDocument();
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('should display 100% for scale 1', () => {
    render(
      <ZoomControls
        scale={1}
        onZoomIn={mockOnZoomIn}
        onZoomOut={mockOnZoomOut}
        onReset={mockOnReset}
      />
    );

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should display 50% for scale 0.5', () => {
    render(
      <ZoomControls
        scale={0.5}
        onZoomIn={mockOnZoomIn}
        onZoomOut={mockOnZoomOut}
        onReset={mockOnReset}
      />
    );

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should call onZoomIn when + button is clicked', () => {
    const { getByText } = render(
      <ZoomControls
        scale={1}
        onZoomIn={mockOnZoomIn}
        onZoomOut={mockOnZoomOut}
        onReset={mockOnReset}
      />
    );

    getByText('+').click();
    expect(mockOnZoomIn).toHaveBeenCalledOnce();
  });

  it('should call onZoomOut when - button is clicked', () => {
    const { getByText } = render(
      <ZoomControls
        scale={1}
        onZoomIn={mockOnZoomIn}
        onZoomOut={mockOnZoomOut}
        onReset={mockOnReset}
      />
    );

    getByText('-').click();
    expect(mockOnZoomOut).toHaveBeenCalledOnce();
  });

  it('should call onResetZoom when percentage is clicked', () => {
    const { getByText } = render(
      <ZoomControls
        scale={1.5}
        onZoomIn={mockOnZoomIn}
        onZoomOut={mockOnZoomOut}
        onReset={mockOnReset}
      />
    );

    getByText('150%').click();
    expect(mockOnReset).toHaveBeenCalledOnce();
  });

  it('should round percentage to nearest integer', () => {
    render(
      <ZoomControls
        scale={1.234}
        onZoomIn={mockOnZoomIn}
        onZoomOut={mockOnZoomOut}
        onReset={mockOnReset}
      />
    );

    expect(screen.getByText('123%')).toBeInTheDocument();
  });
});
