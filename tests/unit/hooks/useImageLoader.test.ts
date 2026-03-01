import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useImageLoader } from '@renderer/hooks/useImageLoader';

describe('useImageLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null state', () => {
    const { result } = renderHook(() => useImageLoader(null));

    expect(result.current.loadedImageUrl).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load image successfully', async () => {
    const mockDataUrl = 'data:image/jpeg;base64,mockdata';
    (window.electronAPI.readImageFile as any).mockResolvedValue(mockDataUrl);

    const { result } = renderHook(() => useImageLoader('C:\\test\\image.jpg'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.loadedImageUrl).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.loadedImageUrl).toBe(mockDataUrl);
    expect(result.current.error).toBeNull();
    expect(window.electronAPI.readImageFile).toHaveBeenCalledWith('C:\\test\\image.jpg');
  });

  it('should handle error when loading fails', async () => {
    const errorMessage = 'File not found';
    (window.electronAPI.readImageFile as any).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useImageLoader('C:\\test\\nonexistent.jpg'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.loadedImageUrl).toBeNull();
    expect(result.current.error).toBe(errorMessage);
  });

  it('should handle non-Error exceptions', async () => {
    (window.electronAPI.readImageFile as any).mockRejectedValue('Unknown error');

    const { result } = renderHook(() => useImageLoader('C:\\test\\image.jpg'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load image');
  });

  it('should reset state when imagePath becomes null', async () => {
    const mockDataUrl = 'data:image/jpeg;base64,mockdata';
    (window.electronAPI.readImageFile as any).mockResolvedValue(mockDataUrl);

    const { result, rerender } = renderHook(
      ({ path }) => useImageLoader(path),
      { initialProps: { path: 'C:\\test\\image.jpg' as string | null } }
    );

    await waitFor(() => {
      expect(result.current.loadedImageUrl).toBe(mockDataUrl);
    });

    // Change to null
    rerender({ path: null });

    expect(result.current.loadedImageUrl).toBeNull();
  });

  it('should load new image when path changes', async () => {
    const mockDataUrl1 = 'data:image/jpeg;base64,mockdata1';
    const mockDataUrl2 = 'data:image/jpeg;base64,mockdata2';

    (window.electronAPI.readImageFile as any)
      .mockResolvedValueOnce(mockDataUrl1)
      .mockResolvedValueOnce(mockDataUrl2);

    const { result, rerender } = renderHook(
      ({ path }) => useImageLoader(path),
      { initialProps: { path: 'C:\\test\\image1.jpg' } }
    );

    await waitFor(() => {
      expect(result.current.loadedImageUrl).toBe(mockDataUrl1);
    });

    // Change to new path
    rerender({ path: 'C:\\test\\image2.jpg' });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.loadedImageUrl).toBe(mockDataUrl2);
    });

    expect(window.electronAPI.readImageFile).toHaveBeenCalledTimes(2);
    expect(window.electronAPI.readImageFile).toHaveBeenNthCalledWith(1, 'C:\\test\\image1.jpg');
    expect(window.electronAPI.readImageFile).toHaveBeenNthCalledWith(2, 'C:\\test\\image2.jpg');
  });

  it('should cancel loading when unmounted', async () => {
    let resolvePromise: (value: string) => void;
    const promise = new Promise<string>((resolve) => {
      resolvePromise = resolve;
    });

    (window.electronAPI.readImageFile as any).mockReturnValue(promise);

    const { result, unmount } = renderHook(() => useImageLoader('C:\\test\\image.jpg'));

    expect(result.current.isLoading).toBe(true);

    // Unmount before promise resolves
    unmount();

    // Resolve the promise after unmount
    resolvePromise!('data:image/jpeg;base64,mockdata');

    // Wait a bit to ensure cleanup happened
    await new Promise((resolve) => setTimeout(resolve, 10));

    // The state should not have been updated after unmount
    expect(result.current.isLoading).toBe(true); // Still true because it was unmounted
  });

  it('should cancel loading when path changes', async () => {
    const mockDataUrl1 = 'data:image/jpeg;base64,mockdata1';
    const mockDataUrl2 = 'data:image/jpeg;base64,mockdata2';

    let resolveFirst: (value: string) => void;
    const firstPromise = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });

    (window.electronAPI.readImageFile as any)
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce(mockDataUrl2);

    const { result, rerender } = renderHook(
      ({ path }) => useImageLoader(path),
      { initialProps: { path: 'C:\\test\\image1.jpg' } }
    );

    expect(result.current.isLoading).toBe(true);

    // Change path before first load completes
    rerender({ path: 'C:\\test\\image2.jpg' });

    // Resolve first promise (should be cancelled)
    resolveFirst!(mockDataUrl1);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have the second image, not the first
    expect(result.current.loadedImageUrl).toBe(mockDataUrl2);
  });
});
