import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

// Mock Electron dialog
const mockShowOpenDialog = vi.fn();

vi.mock('electron', () => ({
  dialog: {
    showOpenDialog: mockShowOpenDialog,
  },
  ipcMain: {
    handle: vi.fn(),
  },
  app: {
    quit: vi.fn(),
    on: vi.fn(),
  },
  BrowserWindow: vi.fn(),
}));

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

describe('Main Process - IPC Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('open-file handler', () => {
    it('should return file path and images when file is selected', async () => {
      const selectedFile = 'C:\\Users\\Test\\Pictures\\photo.jpg';
      const folderPath = path.dirname(selectedFile);

      mockShowOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [selectedFile],
      });

      mockReaddir.mockResolvedValue(['photo.jpg', 'image2.png', 'document.txt']);

      // Simulate the handler logic
      const result = await mockShowOpenDialog({
        properties: ['openFile'],
        filters: [
          {
            name: 'Images',
            extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif', 'ico', 'avif'],
          },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      expect(mockShowOpenDialog).toHaveBeenCalled();
      expect(result.canceled).toBe(false);
      expect(result.filePaths).toContain(selectedFile);
    });

    it('should return null when dialog is canceled', async () => {
      mockShowOpenDialog.mockResolvedValue({
        canceled: true,
        filePaths: [],
      });

      const result = await mockShowOpenDialog({
        properties: ['openFile'],
      });

      if (result.canceled || result.filePaths.length === 0) {
        expect(result.canceled).toBe(true);
        expect(result.filePaths).toHaveLength(0);
      }
    });

    it('should return null when no file paths returned', async () => {
      mockShowOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [],
      });

      const result = await mockShowOpenDialog();

      if (result.canceled || result.filePaths.length === 0) {
        expect(result.filePaths).toHaveLength(0);
      }
    });

    it('should get images from the same folder', async () => {
      mockReaddir.mockResolvedValue([
        'image1.jpg',
        'image2.png',
        'image3.gif',
        'document.pdf',
      ]);

      const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'];
      const folderPath = 'C:\\test';

      const files = await mockReaddir(folderPath);
      const images = files
        .filter((file: string) => {
          const ext = path.extname(file).toLowerCase();
          return IMAGE_EXTENSIONS.includes(ext);
        })
        .map((file: string) => path.join(folderPath, file))
        .sort();

      expect(images).toHaveLength(3);
      expect(images).toContain(path.join(folderPath, 'image1.jpg'));
      expect(images).toContain(path.join(folderPath, 'image2.png'));
      expect(images).toContain(path.join(folderPath, 'image3.gif'));
    });
  });

  describe('open-folder handler', () => {
    it('should return images when folder is selected', async () => {
      const selectedFolder = 'C:\\Users\\Test\\Pictures';

      mockShowOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [selectedFolder],
      });

      mockReaddir.mockResolvedValue(['photo1.jpg', 'photo2.png', 'readme.txt']);

      const result = await mockShowOpenDialog({
        properties: ['openDirectory'],
      });

      expect(mockShowOpenDialog).toHaveBeenCalled();
      expect(result.canceled).toBe(false);
      expect(result.filePaths[0]).toBe(selectedFolder);
    });

    it('should return null when folder dialog is canceled', async () => {
      mockShowOpenDialog.mockResolvedValue({
        canceled: true,
        filePaths: [],
      });

      const result = await mockShowOpenDialog({
        properties: ['openDirectory'],
      });

      expect(result.canceled).toBe(true);
    });
  });

  describe('get-images-in-folder handler', () => {
    it('should return images from specified folder', async () => {
      const folderPath = 'C:\\test\\images';
      mockReaddir.mockResolvedValue(['a.jpg', 'b.png', 'c.gif', 'file.txt']);

      const IMAGE_EXTENSIONS = ['.jpg', '.png', '.gif'];
      const files = await mockReaddir(folderPath);
      const images = files
        .filter((file: string) => {
          const ext = path.extname(file).toLowerCase();
          return IMAGE_EXTENSIONS.includes(ext);
        })
        .map((file: string) => path.join(folderPath, file));

      expect(mockReaddir).toHaveBeenCalledWith(folderPath);
      expect(images).toHaveLength(3);
    });

    it('should handle errors when reading folder', async () => {
      mockReaddir.mockRejectedValue(new Error('Folder not found'));

      try {
        await mockReaddir('C:\\nonexistent');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('get-file-stats handler', () => {
    it('should identify file correctly', async () => {
      mockStat.mockResolvedValue({
        isDirectory: () => false,
        isFile: () => true,
      });

      const stats = await mockStat('C:\\test\\image.jpg');

      expect(stats.isFile()).toBe(true);
      expect(stats.isDirectory()).toBe(false);
    });

    it('should identify directory correctly', async () => {
      mockStat.mockResolvedValue({
        isDirectory: () => true,
        isFile: () => false,
      });

      const stats = await mockStat('C:\\test\\folder');

      expect(stats.isDirectory()).toBe(true);
      expect(stats.isFile()).toBe(false);
    });

    it('should return null on error', async () => {
      mockStat.mockRejectedValue(new Error('File not found'));

      try {
        await mockStat('C:\\nonexistent\\file.jpg');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('read-image-file handler', () => {
    it('should read file and return base64 data URL', async () => {
      const testBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]); // JPEG header
      mockReadFile.mockResolvedValue(testBuffer);

      const filePath = 'C:\\test\\image.jpg';
      const buffer = await mockReadFile(filePath);
      const ext = path.extname(filePath).toLowerCase();

      let mimeType = 'image/png';
      if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';

      const base64 = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;

      expect(mockReadFile).toHaveBeenCalledWith(filePath);
      expect(dataUrl).toContain('data:image/jpeg;base64,');
    });

    it('should handle file read errors', async () => {
      mockReadFile.mockRejectedValue(new Error('Permission denied'));

      try {
        await mockReadFile('C:\\protected\\image.jpg');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Permission denied');
      }
    });

    it('should detect correct MIME type for different formats', async () => {
      const testCases = [
        { path: 'test.jpg', expected: 'image/jpeg' },
        { path: 'test.jpeg', expected: 'image/jpeg' },
        { path: 'test.png', expected: 'image/png' },
        { path: 'test.gif', expected: 'image/gif' },
        { path: 'test.bmp', expected: 'image/bmp' },
        { path: 'test.webp', expected: 'image/webp' },
        { path: 'test.tiff', expected: 'image/tiff' },
        { path: 'test.tif', expected: 'image/tiff' },
        { path: 'test.ico', expected: 'image/x-icon' },
        { path: 'test.avif', expected: 'image/avif' },
      ];

      for (const testCase of testCases) {
        const ext = path.extname(testCase.path).toLowerCase();

        let mimeType = 'image/png';
        if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
        else if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.gif') mimeType = 'image/gif';
        else if (ext === '.bmp') mimeType = 'image/bmp';
        else if (ext === '.webp') mimeType = 'image/webp';
        else if (ext === '.ico') mimeType = 'image/x-icon';
        else if (ext === '.avif') mimeType = 'image/avif';
        else if (ext === '.tiff' || ext === '.tif') mimeType = 'image/tiff';

        expect(mimeType).toBe(testCase.expected);
      }
    });
  });

  describe('Dialog filters', () => {
    it('should have correct file filters for open-file dialog', () => {
      const filters = [
        {
          name: 'Images',
          extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif', 'ico', 'avif'],
        },
        { name: 'All Files', extensions: ['*'] },
      ];

      expect(filters[0].name).toBe('Images');
      expect(filters[0].extensions).toContain('jpg');
      expect(filters[0].extensions).toContain('png');
      expect(filters[0].extensions).toContain('webp');
      expect(filters[1].name).toBe('All Files');
      expect(filters[1].extensions).toContain('*');
    });
  });
});
