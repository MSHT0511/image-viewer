import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageList } from '@renderer/hooks/useImageList';

describe('useImageList', () => {
  describe('setImages', () => {
    it('should set images with default index 0', () => {
      const { result } = renderHook(() => useImageList());

      act(() => {
        result.current.setImages(['image1.jpg', 'image2.jpg', 'image3.jpg']);
      });

      expect(result.current.images).toEqual(['image1.jpg', 'image2.jpg', 'image3.jpg']);
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.currentImage).toBe('image1.jpg');
      expect(result.current.hasImages).toBe(true);
    });

    it('should set images with specified index', () => {
      const { result } = renderHook(() => useImageList());

      act(() => {
        result.current.setImages(['image1.jpg', 'image2.jpg', 'image3.jpg'], 1);
      });

      expect(result.current.currentIndex).toBe(1);
      expect(result.current.currentImage).toBe('image2.jpg');
    });

    it('should handle empty array', () => {
      const { result } = renderHook(() => useImageList());

      act(() => {
        result.current.setImages([]);
      });

      expect(result.current.images).toEqual([]);
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.currentImage).toBeNull();
      expect(result.current.hasImages).toBe(false);
    });

    it('should clamp index to valid range when index is too large', () => {
      const { result } = renderHook(() => useImageList());

      act(() => {
        result.current.setImages(['image1.jpg', 'image2.jpg'], 10);
      });

      expect(result.current.currentIndex).toBe(1); // clamped to max index
      expect(result.current.currentImage).toBe('image2.jpg');
    });

    it('should clamp index to 0 when index is negative', () => {
      const { result } = renderHook(() => useImageList());

      act(() => {
        result.current.setImages(['image1.jpg', 'image2.jpg'], -5);
      });

      expect(result.current.currentIndex).toBe(0); // clamped to 0
      expect(result.current.currentImage).toBe('image1.jpg');
    });
  });

  describe('nextImage', () => {
    it('should advance to next image', () => {
      const { result } = renderHook(() => useImageList());

      act(() => {
        result.current.setImages(['image1.jpg', 'image2.jpg', 'image3.jpg']);
      });

      act(() => {
        result.current.nextImage();
      });

      expect(result.current.currentIndex).toBe(1);
      expect(result.current.currentImage).toBe('image2.jpg');
    });

    it('should loop to beginning from last image', () => {
      const { result } = renderHook(() => useImageList());

      act(() => {
        result.current.setImages(['image1.jpg', 'image2.jpg', 'image3.jpg'], 2);
      });

      act(() => {
        result.current.nextImage();
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.currentImage).toBe('image1.jpg');
    });

    it('should stay at 0 when image list is empty', () => {
      const { result } = renderHook(() => useImageList());

      act(() => {
        result.current.setImages([]);
      });

      act(() => {
        result.current.nextImage();
      });

      expect(result.current.currentIndex).toBe(0);
    });

    it('should stay on same image when only one image exists', () => {
      const { result } = renderHook(() => useImageList());

      act(() => {
        result.current.setImages(['image1.jpg']);
      });

      act(() => {
        result.current.nextImage();
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.currentImage).toBe('image1.jpg');
    });
  });

  describe('prevImage', () => {
    it('should go to previous image', () => {
      const { result } = renderHook(() => useImageList());

      act(() => {
        result.current.setImages(['image1.jpg', 'image2.jpg', 'image3.jpg'], 1);
      });

      act(() => {
        result.current.prevImage();
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.currentImage).toBe('image1.jpg');
    });

    it('should loop to end from first image', () => {
      const { result } = renderHook(() => useImageList());

      act(() => {
        result.current.setImages(['image1.jpg', 'image2.jpg', 'image3.jpg'], 0);
      });

      act(() => {
        result.current.prevImage();
      });

      expect(result.current.currentIndex).toBe(2);
      expect(result.current.currentImage).toBe('image3.jpg');
    });

    it('should stay at 0 when image list is empty', () => {
      const { result } = renderHook(() => useImageList());

      act(() => {
        result.current.setImages([]);
      });

      act(() => {
        result.current.prevImage();
      });

      expect(result.current.currentIndex).toBe(0);
    });

    it('should stay on same image when only one image exists', () => {
      const { result } = renderHook(() => useImageList());

      act(() => {
        result.current.setImages(['image1.jpg']);
      });

      act(() => {
        result.current.prevImage();
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.currentImage).toBe('image1.jpg');
    });
  });
});
