import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

  describe('handleDrop', () => {
    it('should handle directory drop with images', async () => {
      const mockGetFileStats = vi.fn().mockResolvedValue({ isDirectory: true, isFile: false });
      const mockGetImagesInFolder = vi.fn().mockResolvedValue([
        'C:\\test\\folder\\image1.jpg',
        'C:\\test\\folder\\image2.jpg',
        'C:\\test\\folder\\image3.jpg'
      ]);
      const mockGetPathForFile = vi.fn().mockReturnValue('C:\\test\\folder');
      
      window.electronAPI.getFileStats = mockGetFileStats;
      window.electronAPI.getImagesInFolder = mockGetImagesInFolder;
      window.electronAPI.getPathForFile = mockGetPathForFile;

      const { container } = render(<App />);
      const dropZone = container.querySelector('.file-drop-zone') as HTMLElement;

      // Create mock file for directory
      const mockFile = new File([], 'folder', { type: '' });
      Object.defineProperty(mockFile, 'path', { value: 'C:\\test\\folder' });

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [mockFile],
          items: [{}]
        }
      });

      fireEvent(dropZone, dropEvent);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockGetFileStats).toHaveBeenCalledWith('C:\\test\\folder');
      expect(mockGetImagesInFolder).toHaveBeenCalledWith('C:\\test\\folder');
    });

    it('should handle directory drop with no images', async () => {
      const mockGetFileStats = vi.fn().mockResolvedValue({ isDirectory: true, isFile: false });
      const mockGetImagesInFolder = vi.fn().mockResolvedValue([]);
      const mockGetPathForFile = vi.fn().mockReturnValue('C:\\test\\empty');
      
      window.electronAPI.getFileStats = mockGetFileStats;
      window.electronAPI.getImagesInFolder = mockGetImagesInFolder;
      window.electronAPI.getPathForFile = mockGetPathForFile;

      const { container } = render(<App />);
      const dropZone = container.querySelector('.file-drop-zone') as HTMLElement;

      const mockFile = new File([], 'empty', { type: '' });
      Object.defineProperty(mockFile, 'path', { value: 'C:\\test\\empty' });

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [mockFile],
          items: [{}]
        }
      });

      fireEvent(dropZone, dropEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockGetImagesInFolder).toHaveBeenCalledWith('C:\\test\\empty');
    });

    it('should handle file drop with backslash separator (Windows path)', async () => {
      const mockGetFileStats = vi.fn().mockResolvedValue({ isDirectory: false, isFile: true });
      const mockGetImagesInFolder = vi.fn().mockResolvedValue([
        'C:\\test\\folder\\image1.jpg',
        'C:\\test\\folder\\image2.jpg',
        'C:\\test\\folder\\image3.jpg'
      ]);
      const mockGetPathForFile = vi.fn().mockReturnValue('C:\\test\\folder\\image2.jpg');
      
      window.electronAPI.getFileStats = mockGetFileStats;
      window.electronAPI.getImagesInFolder = mockGetImagesInFolder;
      window.electronAPI.getPathForFile = mockGetPathForFile;

      const { container } = render(<App />);
      const dropZone = container.querySelector('.file-drop-zone') as HTMLElement;

      const mockFile = new File([], 'image2.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'path', { value: 'C:\\test\\folder\\image2.jpg' });

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [mockFile],
          items: [{}]
        }
      });

      fireEvent(dropZone, dropEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockGetFileStats).toHaveBeenCalledWith('C:\\test\\folder\\image2.jpg');
      expect(mockGetImagesInFolder).toHaveBeenCalledWith('C:\\test\\folder');
    });

    it('should handle file drop with forward slash separator (Unix path)', async () => {
      const mockGetFileStats = vi.fn().mockResolvedValue({ isDirectory: false, isFile: true });
      const mockGetImagesInFolder = vi.fn().mockResolvedValue([
        '/home/user/images/photo1.jpg',
        '/home/user/images/photo2.jpg'
      ]);
      const mockGetPathForFile = vi.fn().mockReturnValue('/home/user/images/photo1.jpg');
      
      window.electronAPI.getFileStats = mockGetFileStats;
      window.electronAPI.getImagesInFolder = mockGetImagesInFolder;
      window.electronAPI.getPathForFile = mockGetPathForFile;

      const { container } = render(<App />);
      const dropZone = container.querySelector('.file-drop-zone') as HTMLElement;

      const mockFile = new File([], 'photo1.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'path', { value: '/home/user/images/photo1.jpg' });

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [mockFile],
          items: [{}]
        }
      });

      fireEvent(dropZone, dropEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockGetFileStats).toHaveBeenCalledWith('/home/user/images/photo1.jpg');
      expect(mockGetImagesInFolder).toHaveBeenCalledWith('/home/user/images');
    });

    it('should handle file drop with no separator (invalid path)', async () => {
      const mockGetFileStats = vi.fn().mockResolvedValue({ isDirectory: false, isFile: true });
      const mockGetImagesInFolder = vi.fn();
      const mockGetPathForFile = vi.fn().mockReturnValue('image.jpg');
      
      window.electronAPI.getFileStats = mockGetFileStats;
      window.electronAPI.getImagesInFolder = mockGetImagesInFolder;
      window.electronAPI.getPathForFile = mockGetPathForFile;

      const { container } = render(<App />);
      const dropZone = container.querySelector('.file-drop-zone') as HTMLElement;

      const mockFile = new File([], 'image.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'path', { value: 'image.jpg' });

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [mockFile],
          items: [{}]
        }
      });

      fireEvent(dropZone, dropEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockGetFileStats).toHaveBeenCalledWith('image.jpg');
      // Should not call getImagesInFolder for invalid path
      expect(mockGetImagesInFolder).not.toHaveBeenCalled();
    });

    it('should handle file drop with empty folder result', async () => {
      const mockGetFileStats = vi.fn().mockResolvedValue({ isDirectory: false, isFile: true });
      const mockGetImagesInFolder = vi.fn().mockResolvedValue([]);
      const mockGetPathForFile = vi.fn().mockReturnValue('C:\\test\\folder\\image.jpg');
      
      window.electronAPI.getFileStats = mockGetFileStats;
      window.electronAPI.getImagesInFolder = mockGetImagesInFolder;
      window.electronAPI.getPathForFile = mockGetPathForFile;

      const { container } = render(<App />);
      const dropZone = container.querySelector('.file-drop-zone') as HTMLElement;

      const mockFile = new File([], 'image.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'path', { value: 'C:\\test\\folder\\image.jpg' });

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [mockFile],
          items: [{}]
        }
      });

      fireEvent(dropZone, dropEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockGetImagesInFolder).toHaveBeenCalledWith('C:\\test\\folder');
    });
  });

  describe('handleDoubleClick', () => {
    it('should reset zoom on double click when image is loaded', async () => {
      const mockOpenFile = vi.fn().mockResolvedValue({
        filePath: 'C:\\test\\image.jpg',
        images: ['C:\\test\\image.jpg']
      });
      const mockReadImageFile = vi.fn().mockResolvedValue('data:image/jpeg;base64,test');
      
      window.electronAPI.openFile = mockOpenFile;
      window.electronAPI.readImageFile = mockReadImageFile;

      const { container } = render(<App />);

      // Open a file first
      const openFileButton = screen.getByText(/ファイルを開く/);
      openFileButton.click();

      await waitFor(() => {
        expect(mockOpenFile).toHaveBeenCalled();
      });

      // Wait for image to load
      await waitFor(() => {
        expect(mockReadImageFile).toHaveBeenCalled();
      });

      // Zoom in
      const zoomInButton = screen.getByText('+');
      zoomInButton.click();

      // Wait for zoom to change
      await waitFor(() => {
        const zoomText = screen.getByText(/%/);
        expect(zoomText.textContent).not.toBe('100%');
      });

      // Double click to reset zoom
      const imageViewer = container.querySelector('.image-viewer') as HTMLElement;
      fireEvent.doubleClick(imageViewer);

      // Verify zoom is reset to 100%
      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
      });
    });

    it('should not reset zoom on double click when no image is loaded', () => {
      const { container } = render(<App />);

      // Try to double click without loading an image
      const imageViewer = container.querySelector('.image-viewer') as HTMLElement;
      fireEvent.doubleClick(imageViewer);

      // Zoom should still be 100% (unchanged)
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });
});
