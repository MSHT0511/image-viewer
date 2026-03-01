import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';

// Type definitions for Electron Forge Vite plugin
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
try {
  if (require('electron-squirrel-startup')) {
    app.quit();
  }
} catch (e) {
  // electron-squirrel-startup may not be available in packaged app
}

const IMAGE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.bmp',
  '.webp', '.tiff', '.tif', '.ico', '.avif'
];

/**
 * Get all image files in a folder
 */
async function getImagesInFolder(folderPath: string): Promise<string[]> {
  try {
    const files = await fs.readdir(folderPath);
    const images = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return IMAGE_EXTENSIONS.includes(ext);
      })
      .map(file => path.join(folderPath, file))
      .sort();
    return images;
  } catch (error) {
    console.error('Error reading folder:', error);
    return [];
  }
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    // Open the DevTools in development only
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers

/**
 * Open file dialog and return selected file path with all images in the same folder
 */
ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif', 'ico', 'avif'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  const folderPath = path.dirname(filePath);
  const images = await getImagesInFolder(folderPath);

  return {
    filePath,
    images
  };
});

/**
 * Open folder dialog and return all images in the folder
 */
ipcMain.handle('open-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const folderPath = result.filePaths[0];
  const images = await getImagesInFolder(folderPath);

  return {
    images
  };
});

/**
 * Get all images in a specific folder path
 */
ipcMain.handle('get-images-in-folder', async (_event, folderPath: string) => {
  return await getImagesInFolder(folderPath);
});

/**
 * Get file stats (to check if path is file or directory)
 */
ipcMain.handle('get-file-stats', async (_event, filePath: string) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile()
    };
  } catch (error) {
    console.error('Error getting file stats:', error);
    return null;
  }
});

/**
 * Read image file and return as base64 data URL
 */
ipcMain.handle('read-image-file', async (_event, filePath: string) => {
  try {
    console.log('📖 [Main] Reading image file:', filePath);
    const buffer = await fs.readFile(filePath);
    console.log('📖 [Main] File read successfully, size:', buffer.length, 'bytes');
    const ext = path.extname(filePath).toLowerCase();
    console.log('📖 [Main] File extension:', ext);

    // Determine MIME type
    let mimeType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.bmp') mimeType = 'image/bmp';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.ico') mimeType = 'image/x-icon';
    else if (ext === '.avif') mimeType = 'image/avif';
    else if (ext === '.tiff' || ext === '.tif') mimeType = 'image/tiff';

    console.log('📖 [Main] MIME type:', mimeType);
    const base64 = buffer.toString('base64');
    console.log('✅ [Main] Base64 encoded successfully, length:', base64.length);
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('❌ [Main] Error reading image file:', error);
    throw error;
  }
});
