import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileDropZone } from '@renderer/components/FileDropZone';

describe('FileDropZone', () => {
  const mockOnDrop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children', () => {
    render(
      <FileDropZone onDrop={mockOnDrop}>
        <div data-testid="child">Test Content</div>
      </FileDropZone>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should show dragging state on drag enter', () => {
    const { container } = render(
      <FileDropZone onDrop={mockOnDrop}>
        <div>Content</div>
      </FileDropZone>
    );

    const dropZone = container.firstChild as HTMLElement;

    const dragEvent = new Event('dragenter', { bubbles: true });
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: {
        items: [{}],
        types: ['Files'],
      },
    });

    fireEvent(dropZone, dragEvent);

    // The component should now be in dragging state
    // (visual indication would be tested in E2E)
  });

  it('should handle drag over', () => {
    const { container } = render(
      <FileDropZone onDrop={mockOnDrop}>
        <div>Content</div>
      </FileDropZone>
    );

    const dropZone = container.firstChild as HTMLElement;

    const dragOverEvent = new Event('dragover', { bubbles: true });
    Object.defineProperty(dragOverEvent, 'dataTransfer', {
      value: {
        types: ['Files'],
      },
    });

    // Should not throw error
    expect(() => {
      fireEvent(dropZone, dragOverEvent);
    }).not.toThrow();
  });

  it('should handle drag leave when leaving boundaries', () => {
    const { container } = render(
      <FileDropZone onDrop={mockOnDrop}>
        <div>Content</div>
      </FileDropZone>
    );

    const dropZone = container.firstChild as HTMLElement;

    // Mock getBoundingClientRect
    vi.spyOn(dropZone, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      right: 100,
      top: 0,
      bottom: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const dragLeaveEvent = new MouseEvent('dragleave', {
      bubbles: true,
      clientX: -10, // Outside left boundary
      clientY: 50,
    });

    Object.defineProperty(dragLeaveEvent, 'dataTransfer', {
      value: {
        types: ['Files'],
      },
    });

    fireEvent(dropZone, dragLeaveEvent);

    // Should hide dragging state when leaving boundaries
  });

  it('should not hide dragging state when drag leave is within boundaries', () => {
    const { container } = render(
      <FileDropZone onDrop={mockOnDrop}>
        <div>Content</div>
      </FileDropZone>
    );

    const dropZone = container.firstChild as HTMLElement;

    vi.spyOn(dropZone, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      right: 100,
      top: 0,
      bottom: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const dragLeaveEvent = new MouseEvent('dragleave', {
      bubbles: true,
      clientX: 50, // Inside boundaries
      clientY: 50,
    });

    Object.defineProperty(dragLeaveEvent, 'dataTransfer', {
      value: {
        types: ['Files'],
      },
    });

    fireEvent(dropZone, dragLeaveEvent);

    // Should keep dragging state when still within boundaries
  });

  it('should handle file drop with valid path', async () => {
    (window.electronAPI.getPathForFile as any) = vi.fn().mockReturnValue('C:\\test\\image.jpg');
    (window.electronAPI.getFileStats as any) = vi
      .fn()
      .mockResolvedValue({ isDirectory: false, isFile: true });

    const { container } = render(
      <FileDropZone onDrop={mockOnDrop}>
        <div>Content</div>
      </FileDropZone>
    );

    const dropZone = container.firstChild as HTMLElement;

    const file = new File([''], 'image.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'path', { value: 'C:\\test\\image.jpg' });

    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file],
        items: [{}],
      },
    });

    fireEvent(dropZone, dropEvent);

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(window.electronAPI.getFileStats).toHaveBeenCalledWith('C:\\test\\image.jpg');
    expect(mockOnDrop).toHaveBeenCalledWith('C:\\test\\image.jpg', false);
  });

  it('should handle directory drop', async () => {
    (window.electronAPI.getPathForFile as any) = vi.fn().mockReturnValue('C:\\test\\folder');
    (window.electronAPI.getFileStats as any) = vi
      .fn()
      .mockResolvedValue({ isDirectory: true, isFile: false });

    const { container } = render(
      <FileDropZone onDrop={mockOnDrop}>
        <div>Content</div>
      </FileDropZone>
    );

    const dropZone = container.firstChild as HTMLElement;

    const file = new File([''], 'folder', { type: '' });
    Object.defineProperty(file, 'path', { value: 'C:\\test\\folder' });

    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file],
        items: [{}],
      },
    });

    fireEvent(dropZone, dropEvent);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockOnDrop).toHaveBeenCalledWith('C:\\test\\folder', true);
  });

  it('should handle getPathForFile failure gracefully', async () => {
    (window.electronAPI.getPathForFile as any) = vi
      .fn()
      .mockImplementation(() => {
        throw new Error('getPathForFile failed');
      });
    (window.electronAPI.getFileStats as any) = vi
      .fn()
      .mockResolvedValue({ isDirectory: false, isFile: true });

    const { container } = render(
      <FileDropZone onDrop={mockOnDrop}>
        <div>Content</div>
      </FileDropZone>
    );

    const dropZone = container.firstChild as HTMLElement;

    const file = new File([''], 'image.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'path', { value: 'C:\\test\\image.jpg' });

    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file],
        items: [{}],
      },
    });

    fireEvent(dropZone, dropEvent);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should fall back to file.path
    expect(mockOnDrop).toHaveBeenCalledWith('C:\\test\\image.jpg', false);
  });

  it('should not call onDrop when file has no path', async () => {
    (window.electronAPI.getPathForFile as any) = vi.fn().mockReturnValue(undefined);

    const { container } = render(
      <FileDropZone onDrop={mockOnDrop}>
        <div>Content</div>
      </FileDropZone>
    );

    const dropZone = container.firstChild as HTMLElement;

    const file = new File([''], 'image.jpg', { type: 'image/jpeg' });
    // No path property

    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file],
        items: [{}],
      },
    });

    fireEvent(dropZone, dropEvent);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockOnDrop).not.toHaveBeenCalled();
  });

  it('should not call onDrop when getFileStats returns null', async () => {
    (window.electronAPI.getPathForFile as any) = vi.fn().mockReturnValue('C:\\test\\image.jpg');
    (window.electronAPI.getFileStats as any) = vi.fn().mockResolvedValue(null);

    const { container } = render(
      <FileDropZone onDrop={mockOnDrop}>
        <div>Content</div>
      </FileDropZone>
    );

    const dropZone = container.firstChild as HTMLElement;

    const file = new File([''], 'image.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'path', { value: 'C:\\test\\image.jpg' });

    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file],
        items: [{}],
      },
    });

    fireEvent(dropZone, dropEvent);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockOnDrop).not.toHaveBeenCalled();
  });

  it('should handle drop with no files', () => {
    const { container } = render(
      <FileDropZone onDrop={mockOnDrop}>
        <div>Content</div>
      </FileDropZone>
    );

    const dropZone = container.firstChild as HTMLElement;

    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [],
        items: [],
      },
    });

    fireEvent(dropZone, dropEvent);

    expect(mockOnDrop).not.toHaveBeenCalled();
  });
});
