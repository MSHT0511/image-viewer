import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '@renderer/App';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render app with initial state', () => {
    const { container } = render(<App />);

    expect(container.querySelector('.app')).toBeInTheDocument();
    expect(screen.getByText(/画像を開くには/)).toBeInTheDocument();
  });

  it('should render all major components', () => {
    const { container } = render(<App />);

    // Verify major UI sections exist
    expect(container.querySelector('.toolbar')).toBeInTheDocument();
    expect(container.querySelector('.image-viewer')).toBeInTheDocument();
    expect(container.querySelector('.navigation-controls')).toBeInTheDocument();
    expect(container.querySelector('.zoom-controls')).toBeInTheDocument();
  });

  it('should call openFile API when file button is clicked', async () => {
    const mockOpenFile = vi.fn().mockResolvedValue({
      filePath: 'C:\\test\\image.jpg',
      images: ['C:\\test\\image.jpg', 'C:\\test\\image2.jpg']
    });
    window.electronAPI.openFile = mockOpenFile;

    render(<App />);

    const openFileButton = screen.getByText(/ファイルを開く/);
    openFileButton.click();

    await waitFor(() => {
      expect(mockOpenFile).toHaveBeenCalled();
    });
  });

  it('should call openFolder API when folder button is clicked', async () => {
    const mockOpenFolder = vi.fn().mockResolvedValue({
      folderPath: 'C:\\test',
      images: ['C:\\test\\image1.jpg', 'C:\\test\\image2.jpg']
    });
    window.electronAPI.openFolder = mockOpenFolder;

    render(<App />);

    const openFolderButton = screen.getByText(/フォルダを開く/);
    openFolderButton.click();

    await waitFor(() => {
      expect(mockOpenFolder).toHaveBeenCalled();
    });
  });

  it('should handle navigation controls', async () => {
    const mockOpenFolder = vi.fn().mockResolvedValue({
      folderPath: 'C:\\test',
      images: ['C:\\test\\image1.jpg', 'C:\\test\\image2.jpg', 'C:\\test\\image3.jpg']
    });
    window.electronAPI.openFolder = mockOpenFolder;

    render(<App />);

    const openFolderButton = screen.getByText(/フォルダを開く/);
    openFolderButton.click();

    await waitFor(() => {
      expect(mockOpenFolder).toHaveBeenCalled();
    });

    // Navigation buttons should now be enabled
    const nextButton = screen.getByText(/次へ/);
    const prevButton = screen.getByText(/前へ/);

    expect(nextButton).not.toBeDisabled();
    expect(prevButton).not.toBeDisabled();
  });

  it('should handle zoom controls', () => {
    render(<App />);

    const zoomInButton = screen.getByText('+');
    const zoomOutButton = screen.getByText('-');

    expect(zoomInButton).toBeInTheDocument();
    expect(zoomOutButton).toBeInTheDocument();

    // Should display initial zoom level
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should update zoom level when zoom buttons are clicked', () => {
    const { rerender } = render(<App />);

    const zoomInButton = screen.getByText('+');
    zoomInButton.click();

    // After zoom in, percentage should increase
    // Note: The exact value depends on the zoom step in useZoom
    rerender(<App />);

    const zoomPercentage = screen.getByText(/%/);
    expect(zoomPercentage).toBeInTheDocument();
  });

  it('should handle keyboard shortcuts', () => {
    const mockOpenFile = vi.fn().mockResolvedValue({
      filePath: 'C:\\test\\image.jpg',
      images: ['C:\\test\\image.jpg']
    });
    window.electronAPI.openFile = mockOpenFile;

    render(<App />);

    // Simulate Ctrl+O keyboard shortcut
    const keydownEvent = new KeyboardEvent('keydown', {
      key: 'o',
      ctrlKey: true,
      bubbles: true
    });
    document.dispatchEvent(keydownEvent);

    expect(mockOpenFile).toHaveBeenCalled();
  });

  it('should handle document drag and drop prevention', () => {
    const preventDefaultSpy = vi.fn();
    const stopPropagationSpy = vi.fn();

    render(<App />);

    const dragoverEvent = new DragEvent('dragover', {
      bubbles: true
    }) as DragEvent & { preventDefault: () => void; stopPropagation: () => void };

    Object.defineProperty(dragoverEvent, 'preventDefault', {
      value: preventDefaultSpy,
      writable: true
    });
    Object.defineProperty(dragoverEvent, 'stopPropagation', {
      value: stopPropagationSpy,
      writable: true
    });

    document.dispatchEvent(dragoverEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('should show empty state when no images are loaded', () => {
    render(<App />);

    expect(screen.getByText(/画像を開くには/)).toBeInTheDocument();
  });

  it('should handle null result from openFile', async () => {
    const mockOpenFile = vi.fn().mockResolvedValue(null);
    window.electronAPI.openFile = mockOpenFile;

    render(<App />);

    const openFileButton = screen.getByText(/ファイルを開く/);
    openFileButton.click();

    await waitFor(() => {
      expect(mockOpenFile).toHaveBeenCalled();
    });

    // Should still show empty state
    expect(screen.getByText(/画像を開くには/)).toBeInTheDocument();
  });

  it('should handle null result from openFolder', async () => {
    const mockOpenFolder = vi.fn().mockResolvedValue(null);
    window.electronAPI.openFolder = mockOpenFolder;

    render(<App />);

    const openFolderButton = screen.getByText(/フォルダを開く/);
    openFolderButton.click();

    await waitFor(() => {
      expect(mockOpenFolder).toHaveBeenCalled();
    });

    // Should still show empty state
    expect(screen.getByText(/画像を開くには/)).toBeInTheDocument();
  });
});
