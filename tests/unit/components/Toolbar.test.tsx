import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toolbar } from '@renderer/components/Toolbar';

describe('Toolbar', () => {
  const mockOnOpenFile = vi.fn();
  const mockOnOpenFolder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render toolbar with all buttons', () => {
    render(
      <Toolbar
        onOpenFile={mockOnOpenFile}
        onOpenFolder={mockOnOpenFolder}
        currentFileName={null}
        currentIndex={0}
        totalImages={0}
      />
    );

    expect(screen.getByText('ファイルを開く')).toBeInTheDocument();
    expect(screen.getByText('フォルダを開く')).toBeInTheDocument();
  });

  it('should display filename when provided', () => {
    render(
      <Toolbar
        onOpenFile={mockOnOpenFile}
        onOpenFolder={mockOnOpenFolder}
        currentFileName="test.jpg"
        currentIndex={0}
        totalImages={1}
      />
    );

    expect(screen.getByText('test.jpg')).toBeInTheDocument();
  });

  it('should display image count when multiple images', () => {
    render(
      <Toolbar
        onOpenFile={mockOnOpenFile}
        onOpenFolder={mockOnOpenFolder}
        currentFileName="test.jpg"
        currentIndex={1}
        totalImages={5}
      />
    );

    expect(screen.getByText(/2 \/ 5/)).toBeInTheDocument();
  });

  it('should call onOpenFile when button is clicked', () => {
    const { getByText } = render(
      <Toolbar
        onOpenFile={mockOnOpenFile}
        onOpenFolder={mockOnOpenFolder}
        currentFileName={null}
        currentIndex={0}
        totalImages={0}
      />
    );

    getByText('ファイルを開く').click();
    expect(mockOnOpenFile).toHaveBeenCalledOnce();
  });

  it('should call onOpenFolder when button is clicked', () => {
    const { getByText } = render(
      <Toolbar
        onOpenFile={mockOnOpenFile}
        onOpenFolder={mockOnOpenFolder}
        currentFileName={null}
        currentIndex={0}
        totalImages={0}
      />
    );

    getByText('フォルダを開く').click();
    expect(mockOnOpenFolder).toHaveBeenCalledOnce();
  });

  it('should not display filename when not provided', () => {
    render(
      <Toolbar
        onOpenFile={mockOnOpenFile}
        onOpenFolder={mockOnOpenFolder}
        currentFileName={null}
        currentIndex={0}
        totalImages={0}
      />
    );

    const fileName = screen.queryByText(/\.(jpg|png|gif|webp|tiff?)$/i);
    expect(fileName).not.toBeInTheDocument();
  });
});
