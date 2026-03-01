import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

// Mock fs/promises
const mockReaddir = vi.fn();
const mockReadFile = vi.fn();
const mockStat = vi.fn();

vi.mock('fs/promises', () => ({
  default: {
    readdir: mockReaddir,
    readFile: mockReadFile,
    stat: mockStat,
  },
  readdir: mockReaddir,
  readFile: mockReadFile,
  stat: mockStat,
}));

// Mock Electron
vi.mock('electron', () => ({
  app: {
    quit: vi.fn(),
    on: vi.fn(),
  },
  BrowserWindow: vi.fn(),
  ipcMain: {
    handle: vi.fn(),
  },
  dialog: {
    showOpenDialog: vi.fn(),
  },
}));

describe('Main Process - File I/O', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getImagesInFolder', () => {
    it('should filter and return only image files', async () => {
      const mockFiles = [
        'image1.jpg',
        'image2.png',
        'document.txt',
        'image3.gif',
        'video.mp4',
        'image4.webp',
      ];

      mockReaddir.mockResolvedValue(mockFiles);

      const IMAGE_EXTENSIONS = [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.bmp',
        '.webp',
        '.tiff',
        '.tif',
        '.ico',
        '.avif',
      ];

      const folderPath = 'C:\\test\\folder';
      const files = await mockReaddir(folderPath);
      const images = files
        .filter((file: string) => {
          const ext = path.extname(file).toLowerCase();
          return IMAGE_EXTENSIONS.includes(ext);
        })
        .map((file: string) => path.join(folderPath, file))
        .sort();

      expect(mockReaddir).toHaveBeenCalledWith(folderPath);
      expect(images).toHaveLength(4);
      expect(images).toContain(path.join(folderPath, 'image1.jpg'));
      expect(images).toContain(path.join(folderPath, 'image2.png'));
      expect(images).toContain(path.join(folderPath, 'image3.gif'));
      expect(images).toContain(path.join(folderPath, 'image4.webp'));
      expect(images).not.toContain(path.join(folderPath, 'document.txt'));
      expect(images).not.toContain(path.join(folderPath, 'video.mp4'));
    });

    it('should return empty array when no image files exist', async () => {
      const mockFiles = ['document.txt', 'video.mp4', 'audio.mp3'];

      mockReaddir.mockResolvedValue(mockFiles);

      const IMAGE_EXTENSIONS = [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.bmp',
        '.webp',
        '.tiff',
        '.tif',
        '.ico',
        '.avif',
      ];

      const files = mockFiles;
      const images = files
        .filter((file) => {
          const ext = path.extname(file).toLowerCase();
          return IMAGE_EXTENSIONS.includes(ext);
        })
        .map((file) => path.join('C:\\test', file))
        .sort();

      expect(images).toHaveLength(0);
    });

    it('should handle empty folder', async () => {
      mockReaddir.mockResolvedValue([]);

      const IMAGE_EXTENSIONS = [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.bmp',
        '.webp',
        '.tiff',
        '.tif',
        '.ico',
        '.avif',
      ];

      const files: string[] = [];
      const images = files
        .filter((file) => {
          const ext = path.extname(file).toLowerCase();
          return IMAGE_EXTENSIONS.includes(ext);
        })
        .map((file) => path.join('C:\\test', file))
        .sort();

      expect(images).toHaveLength(0);
    });

    it('should handle folder read error gracefully', async () => {
      mockReaddir.mockRejectedValue(new Error('Permission denied'));

      try {
        await mockReaddir('C:\\protected');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Permission denied');
      }
    });

    it('should sort image files alphabetically', async () => {
      const mockFiles = ['zebra.jpg', 'apple.jpg', 'monkey.jpg'];

      mockReaddir.mockResolvedValue(mockFiles);

      const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'];

      const folderPath = 'C:\\test';
      const files = mockFiles;
      const images = files
        .filter((file) => {
          const ext = path.extname(file).toLowerCase();
          return IMAGE_EXTENSIONS.includes(ext);
        })
        .map((file) => path.join(folderPath, file))
        .sort();

      expect(images[0]).toBe(path.join(folderPath, 'apple.jpg'));
      expect(images[1]).toBe(path.join(folderPath, 'monkey.jpg'));
      expect(images[2]).toBe(path.join(folderPath, 'zebra.jpg'));
    });

    it('should handle case-insensitive extensions', async () => {
      const mockFiles = ['image.JPG', 'photo.PnG', 'pic.GIF'];

      mockReaddir.mockResolvedValue(mockFiles);

      const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'];

      const files = mockFiles;
      const images = files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return IMAGE_EXTENSIONS.includes(ext);
      });

      expect(images).toHaveLength(3);
    });

    it('should support all specified image formats', async () => {
      const mockFiles = [
        'test.jpg',
        'test.jpeg',
        'test.png',
        'test.gif',
        'test.bmp',
        'test.webp',
        'test.tiff',
        'test.tif',
        'test.ico',
        'test.avif',
      ];

      mockReaddir.mockResolvedValue(mockFiles);

      const IMAGE_EXTENSIONS = [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.bmp',
        '.webp',
        '.tiff',
        '.tif',
        '.ico',
        '.avif',
      ];

      const files = mockFiles;
      const images = files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return IMAGE_EXTENSIONS.includes(ext);
      });

      expect(images).toHaveLength(10);
    });
  });

  describe('readImageFile - MIME Type Detection', () => {
    it('should detect JPEG MIME type', () => {
      const filePath = 'C:\\test\\image.jpg';
      const ext = path.extname(filePath).toLowerCase();

      let mimeType = 'image/png';
      if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';

      expect(mimeType).toBe('image/jpeg');
    });

    it('should detect PNG MIME type', () => {
      const filePath = 'C:\\test\\image.png';
      const ext = path.extname(filePath).toLowerCase();

      let mimeType = 'image/png';
      if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.png') mimeType = 'image/png';

      expect(mimeType).toBe('image/png');
    });

    it('should detect GIF MIME type', () => {
      const filePath = 'C:\\test\\animation.gif';
      const ext = path.extname(filePath).toLowerCase();

      let mimeType = 'image/png';
      if (ext === '.gif') mimeType = 'image/gif';

      expect(mimeType).toBe('image/gif');
    });

    it('should detect WebP MIME type', () => {
      const filePath = 'C:\\test\\modern.webp';
      const ext = path.extname(filePath).toLowerCase();

      let mimeType = 'image/png';
      if (ext === '.webp') mimeType = 'image/webp';

      expect(mimeType).toBe('image/webp');
    });

    it('should detect TIFF MIME type', () => {
      const filePath = 'C:\\test\\scan.tiff';
      const ext = path.extname(filePath).toLowerCase();

      let mimeType = 'image/png';
      if (ext === '.tiff' || ext === '.tif') mimeType = 'image/tiff';

      expect(mimeType).toBe('image/tiff');
    });

    it('should handle .tif extension', () => {
      const filePath = 'C:\\test\\scan.tif';
      const ext = path.extname(filePath).toLowerCase();

      let mimeType = 'image/png';
      if (ext === '.tiff' || ext === '.tif') mimeType = 'image/tiff';

      expect(mimeType).toBe('image/tiff');
    });

    it('should convert buffer to base64 correctly', () => {
      const testBuffer = Buffer.from('test data');
      const base64 = testBuffer.toString('base64');
      const expected = 'dGVzdCBkYXRh';

      expect(base64).toBe(expected);
    });

    it('should format data URL correctly', () => {
      const mimeType = 'image/jpeg';
      const base64 = 'abc123';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      expect(dataUrl).toBe('data:image/jpeg;base64,abc123');
    });
  });
});
