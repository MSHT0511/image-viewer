import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavigationControls } from '@renderer/components/NavigationControls';

describe('NavigationControls', () => {
  const mockOnNext = vi.fn();
  const mockOnPrev = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render navigation buttons', () => {
    render(<NavigationControls onNext={mockOnNext} onPrev={mockOnPrev} hasImages={true} />);

    expect(screen.getByText(/前へ/)).toBeInTheDocument();
    expect(screen.getByText(/次へ/)).toBeInTheDocument();
  });

  it('should call onPrev when prev button is clicked', () => {
    const { getByText } = render(
      <NavigationControls onNext={mockOnNext} onPrev={mockOnPrev} hasImages={true} />
    );

    getByText(/前へ/).click();
    expect(mockOnPrev).toHaveBeenCalledOnce();
  });

  it('should call onNext when next button is clicked', () => {
    const { getByText } = render(
      <NavigationControls onNext={mockOnNext} onPrev={mockOnPrev} hasImages={true} />
    );

    getByText(/次へ/).click();
    expect(mockOnNext).toHaveBeenCalledOnce();
  });

  it('should disable buttons when disabled prop is true', () => {
    render(<NavigationControls onNext={mockOnNext} onPrev={mockOnPrev} hasImages={false} />);

    const prevButton = screen.getByText(/前へ/);
    const nextButton = screen.getByText(/次へ/);

    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it('should enable buttons when disabled prop is false', () => {
    render(<NavigationControls onNext={mockOnNext} onPrev={mockOnPrev} hasImages={true} />);

    const prevButton = screen.getByText(/前へ/);
    const nextButton = screen.getByText(/次へ/);

    expect(prevButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });
});
