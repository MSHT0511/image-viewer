import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertTiffToDataUrl } from '@renderer/utils/tiffConverter';

// Mock the decode function from 'tiff'
vi.mock('tiff', () => ({
  decode: vi.fn(),
}));

import { decode } from 'tiff';

describe('tiffConverter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('convertTiffToDataUrl', () => {
    it('should convert TIFF file to data URL successfully', async () => {
      // Mock TIFF decode
      const mockImageData = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]); // 2x1 RGBA pixels
      (decode as any).mockReturnValue([
        {
          width: 2,
          height: 1,
          data: mockImageData,
        },
      ]);

      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
      });

      // Mock canvas
      const mockToDataURL = vi.fn().mockReturnValue('data:image/png;base64,mockdata');
      const mockGetContext = vi.fn().mockReturnValue({
        createImageData: vi.fn().mockReturnValue({
          data: new Uint8ClampedArray(8),
        }),
        putImageData: vi.fn(),
      });

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: mockGetContext,
        toDataURL: mockToDataURL,
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

      const result = await convertTiffToDataUrl('C:\\test\\image.tiff');

      expect(result).toBe('data:image/png;base64,mockdata');
      expect(decode).toHaveBeenCalledOnce();
      expect(mockCanvas.width).toBe(2);
      expect(mockCanvas.height).toBe(1);
      expect(mockGetContext).toHaveBeenCalledWith('2d');
      expect(mockToDataURL).toHaveBeenCalledWith('image/png');
    });

    it('should throw error when no images found in TIFF', async () => {
      (decode as any).mockReturnValue([]);

      global.fetch = vi.fn().mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
      });

      await expect(convertTiffToDataUrl('C:\\test\\empty.tiff')).rejects.toThrow(
        'Failed to load TIFF image: No images found in TIFF file'
      );
    });

    it('should throw error when decode returns null', async () => {
      (decode as any).mockReturnValue(null);

      global.fetch = vi.fn().mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
      });

      await expect(convertTiffToDataUrl('C:\\test\\invalid.tiff')).rejects.toThrow(
        'Failed to load TIFF image'
      );
    });

    it('should throw error when canvas context is null', async () => {
      const mockImageData = new Uint8Array([255, 0, 0, 255]);
      (decode as any).mockReturnValue([
        {
          width: 1,
          height: 1,
          data: mockImageData,
        },
      ]);

      global.fetch = vi.fn().mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
      });

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(null),
        toDataURL: vi.fn(),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

      await expect(convertTiffToDataUrl('C:\\test\\image.tiff')).rejects.toThrow(
        'Failed to load TIFF image: Failed to get canvas context'
      );
    });

    it('should throw error when fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(convertTiffToDataUrl('C:\\test\\nonexistent.tiff')).rejects.toThrow(
        'Failed to load TIFF image: Network error'
      );
    });

    it('should handle Windows backslash paths correctly', async () => {
      const mockImageData = new Uint8Array([255, 0, 0, 255]);
      (decode as any).mockReturnValue([
        {
          width: 1,
          height: 1,
          data: mockImageData,
        },
      ]);

      const mockFetch = vi.fn().mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
      });
      global.fetch = mockFetch;

      const mockToDataURL = vi.fn().mockReturnValue('data:image/png;base64,mockdata');
      const mockGetContext = vi.fn().mockReturnValue({
        createImageData: vi.fn().mockReturnValue({
          data: new Uint8ClampedArray(4),
        }),
        putImageData: vi.fn(),
      });

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: mockGetContext,
        toDataURL: mockToDataURL,
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

      await convertTiffToDataUrl('C:\\Users\\Test\\image.tiff');

      // Check that backslashes are converted to forward slashes
      expect(mockFetch).toHaveBeenCalledWith('file:///C:/Users/Test/image.tiff');
    });
  });
});
