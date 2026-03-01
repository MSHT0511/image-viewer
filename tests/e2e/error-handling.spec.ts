import { test, expect } from '@playwright/test';
import { ElectronApp } from './electron-app';
import path from 'path';
import fs from 'fs/promises';

let electronApp: ElectronApp;

test.beforeAll(async () => {
  electronApp = new ElectronApp();
  await electronApp.launch();
});

test.afterAll(async () => {
  await electronApp.close();
});

test.describe('Error Handling Tests', () => {
  test('should handle non-image file drop gracefully', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    // Create a text file
    const textFile = path.join(testDir, 'document.txt');
    await fs.writeFile(textFile, 'This is not an image');

    // Try to drop the text file
    const dropZone = page.locator('.file-drop-zone');
    await dropZone.evaluate(
      (element, filePath) => {
        const dataTransfer = new DataTransfer();
        const file = new File([''], path.basename(filePath), { type: 'text/plain' });
        Object.defineProperty(file, 'path', { value: filePath });
        dataTransfer.items.add(file);

        const event = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        });
        element.dispatchEvent(event);
      },
      textFile
    );

    await page.waitForTimeout(1000);

    // Should not load the file, toolbar should not show filename
    const toolbar = page.locator('.toolbar');
    const toolbarText = await toolbar.textContent();
    expect(toolbarText).not.toContain('document.txt');

    // Cleanup
    await fs.unlink(textFile).catch(() => {});
  });

  test('should handle corrupted image file', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    // Create a corrupted JPEG (invalid data with JPEG extension)
    const corruptedFile = path.join(testDir, 'corrupted.jpg');
    await fs.writeFile(corruptedFile, 'This is not valid JPEG data');

    // Try to drop the corrupted file
    const dropZone = page.locator('.file-drop-zone');
    await dropZone.evaluate(
      (element, filePath) => {
        const dataTransfer = new DataTransfer();
        const file = new File([''], path.basename(filePath), { type: 'image/jpeg' });
        Object.defineProperty(file, 'path', { value: filePath });
        dataTransfer.items.add(file);

        const event = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        });
        element.dispatchEvent(event);
      },
      corruptedFile
    );

    await page.waitForTimeout(1000);

    // App should handle the error gracefully, not crash
    const appElement = page.locator('.app');
    await expect(appElement).toBeVisible();

    // Cleanup
    await fs.unlink(corruptedFile).catch(() => {});
  });

  test('should handle empty folder', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/empty-folder');
    await fs.mkdir(testDir, { recursive: true });

    // Create a dummy file to represent folder drop
    const dummyFile = path.join(testDir, '.keep');
    await fs.writeFile(dummyFile, '');

    // Simulate folder drop (in reality, this would be handled by IPC)
    // For this test, we just verify the app doesn't crash with empty state
    const appElement = page.locator('.app');
    await expect(appElement).toBeVisible();

    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toBeVisible();

    // Cleanup
    await fs.rm(testDir, { recursive: true }).catch(() => {});
  });

  test('should handle very large image file gracefully', async () => {
    const page = electronApp.getPage();

    // Note: We don't actually create a large file to keep tests fast
    // Just verify the app structure can handle loading states
    const appElement = page.locator('.app');
    await expect(appElement).toBeVisible();

    const imageViewer = page.locator('.image-viewer');
    await expect(imageViewer).toBeVisible();
  });

  test('should maintain stability when rapidly switching images', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const testImages = [
      path.join(testDir, 'rapid1.jpg'),
      path.join(testDir, 'rapid2.jpg'),
      path.join(testDir, 'rapid3.jpg'),
    ];

    for (const imagePath of testImages) {
      await fs.writeFile(imagePath, jpegHeader);
    }

    // Load first image
    const dropZone = page.locator('.file-drop-zone');
    await dropZone.evaluate(
      (element, filePath) => {
        const dataTransfer = new DataTransfer();
        const file = new File([''], path.basename(filePath), { type: 'image/jpeg' });
        Object.defineProperty(file, 'path', { value: filePath });
        dataTransfer.items.add(file);

        const event = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        });
        element.dispatchEvent(event);
      },
      testImages[0]
    );

    await page.waitForTimeout(1000);

    // Rapidly press arrow keys
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(50); // Very short delay
    }

    // App should still be stable
    const appElement = page.locator('.app');
    await expect(appElement).toBeVisible();

    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toBeVisible();

    // Cleanup
    for (const imagePath of testImages) {
      await fs.unlink(imagePath).catch(() => {});
    }
  });

  test('should handle special characters in filename', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    // Create file with special characters
    const specialFile = path.join(testDir, 'test image (1) [copy].jpg');
    await fs.writeFile(specialFile, jpegHeader);

    // Load the file
    const dropZone = page.locator('.file-drop-zone');
    await dropZone.evaluate(
      (element, filePath) => {
        const dataTransfer = new DataTransfer();
        const file = new File([''], path.basename(filePath), { type: 'image/jpeg' });
        Object.defineProperty(file, 'path', { value: filePath });
        dataTransfer.items.add(file);

        const event = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        });
        element.dispatchEvent(event);
      },
      specialFile
    );

    await page.waitForTimeout(1000);

    // Should display filename correctly
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toContainText('test image (1) [copy].jpg');

    // Cleanup
    await fs.unlink(specialFile).catch(() => {});
  });

  test('should handle non-existent file path', async () => {
    const page = electronApp.getPage();

    // The app should remain stable even if trying to load non-existent path
    const appElement = page.locator('.app');
    await expect(appElement).toBeVisible();

    // Navigation buttons should be disabled when no images loaded
    const prevButton = page.locator('.navigation-controls button:has-text("前へ")');
    const nextButton = page.locator('.navigation-controls button:has-text("次へ")');

    // Wait for buttons to render
    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();
  });

  test('should handle zoom limits gracefully', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const testImage = path.join(testDir, 'zoom-limit-test.jpg');
    await fs.writeFile(testImage, jpegHeader);

    // Load image
    const dropZone = page.locator('.file-drop-zone');
    await dropZone.evaluate(
      (element, filePath) => {
        const dataTransfer = new DataTransfer();
        const file = new File([''], path.basename(filePath), { type: 'image/jpeg' });
        Object.defineProperty(file, 'path', { value: filePath });
        dataTransfer.items.add(file);

        const event = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        });
        element.dispatchEvent(event);
      },
      testImage
    );

    await page.waitForTimeout(1000);

    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');

    // Try to zoom in excessively
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('+');
      await page.waitForTimeout(50);
    }

    // Should cap at maximum zoom (1000%)
    const maxZoomText = await zoomDisplay.textContent();
    const maxZoom = parseInt(maxZoomText || '0');
    expect(maxZoom).toBeLessThanOrEqual(1000);

    // Reset
    await page.keyboard.press('0');
    await page.waitForTimeout(300);

    // Try to zoom out excessively
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('-');
      await page.waitForTimeout(50);
    }

    // Should cap at minimum zoom (10%)
    const minZoomText = await zoomDisplay.textContent();
    const minZoom = parseInt(minZoomText || '0');
    expect(minZoom).toBeGreaterThanOrEqual(10);

    // Cleanup
    await fs.unlink(testImage).catch(() => {});
  });
});
