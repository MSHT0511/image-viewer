import { contextBridge, ipcRenderer, webUtils } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('open-file'),
  openFolder: () => ipcRenderer.invoke('open-folder'),
  getImagesInFolder: (path: string) => ipcRenderer.invoke('get-images-in-folder', path),
  getFileStats: (path: string) => ipcRenderer.invoke('get-file-stats', path),
  readImageFile: (path: string) => ipcRenderer.invoke('read-image-file', path),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
});

// Type definitions for TypeScript
export interface ElectronAPI {
  openFile: () => Promise<{ filePath: string; images: string[] } | null>;
  openFolder: () => Promise<{ images: string[] } | null>;
  getImagesInFolder: (path: string) => Promise<string[]>;
  getFileStats: (path: string) => Promise<{ isDirectory: boolean; isFile: boolean } | null>;
  readImageFile: (path: string) => Promise<string>;
  getPathForFile: (file: File) => string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
