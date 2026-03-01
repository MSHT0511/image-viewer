import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Electron APIs
global.window = global.window || {};
(global.window as any).electronAPI = {
  readImageFile: vi.fn(),
  openFile: vi.fn(),
  openFolder: vi.fn(),
  getImagesInFolder: vi.fn(),
  getFileStats: vi.fn(),
  getPathForFile: vi.fn(),
};
