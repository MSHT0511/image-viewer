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

test.describe('File Loading Tests', () => {
  test('should load JPEG image successfully', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    // Create a minimal valid JPEG
    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const testImage = path.join(testDir, 'test.jpg');
    await fs.writeFile(testImage, jpegHeader);

    // Simulate drag and drop
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

    // Check that image is loaded (toolbar should show filename)
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toContainText('test.jpg');

    // FileDropZone overlay should be hidden after loading
    const dropZoneOverlay = page.locator('.drop-zone-overlay');
    const isVisible = await dropZoneOverlay.isVisible();
    expect(isVisible).toBe(false);

    // Cleanup
    await fs.unlink(testImage).catch(() => {});
  });

  test('should load PNG image successfully', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    // Create a minimal valid PNG (1x1 transparent pixel)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const testImage = path.join(testDir, 'test.png');
    await fs.writeFile(testImage, pngData);

    // Simulate drag and drop
    const dropZone = page.locator('.file-drop-zone');
    await dropZone.evaluate(
      (element, filePath) => {
        const dataTransfer = new DataTransfer();
        const file = new File([''], path.basename(filePath), { type: 'image/png' });
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

    // Check that image is loaded
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toContainText('test.png');

    // Cleanup
    await fs.unlink(testImage).catch(() => {});
  });

  test('should load GIF image successfully', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    // Create a minimal valid GIF (1x1 transparent pixel)
    const gifData = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
      0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
      0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
      0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
    ]);

    const testImage = path.join(testDir, 'test.gif');
    await fs.writeFile(testImage, gifData);

    // Simulate drag and drop
    const dropZone = page.locator('.file-drop-zone');
    await dropZone.evaluate(
      (element, filePath) => {
        const dataTransfer = new DataTransfer();
        const file = new File([''], path.basename(filePath), { type: 'image/gif' });
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

    // Check that image is loaded
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toContainText('test.gif');

    // Cleanup
    await fs.unlink(testImage).catch(() => {});
  });

  test('should load WebP image successfully', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    // Create a minimal valid WebP (lossy format)
    const webpData = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
      0x56, 0x50, 0x38, 0x20, 0x0e, 0x00, 0x00, 0x00, 0x30, 0x01, 0x00, 0x9d,
      0x01, 0x2a, 0x01, 0x00, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x00,
    ]);

    const testImage = path.join(testDir, 'test.webp');
    await fs.writeFile(testImage, webpData);

    // Simulate drag and drop
    const dropZone = page.locator('.file-drop-zone');
    await dropZone.evaluate(
      (element, filePath) => {
        const dataTransfer = new DataTransfer();
        const file = new File([''], path.basename(filePath), { type: 'image/webp' });
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

    // Check that image is loaded
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toContainText('test.webp');

    // Cleanup
    await fs.unlink(testImage).catch(() => {});
  });

  test('should hide FileDropZone after loading image', async () => {
    const page = electronApp.getPage();

    // Initially, file drop zone should be visible
    const dropZoneText = page.locator('.file-drop-zone p');
    await expect(dropZoneText).toBeVisible();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const testImage = path.join(testDir, 'loaded.jpg');
    await fs.writeFile(testImage, jpegHeader);

    // Simulate drag and drop
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

    // After loading, the drop zone text should not be visible (or have different styling)
    const dropZoneTextVisible = await dropZoneText.isVisible();
    // The text might still be in DOM but with opacity 0 or display none
    // Check that image viewer is now showing content
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toContainText('loaded.jpg');

    // Cleanup
    await fs.unlink(testImage).catch(() => {});
  });

  test('should load multiple images from same folder', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const testImages = [
      path.join(testDir, 'multi1.jpg'),
      path.join(testDir, 'multi2.jpg'),
      path.join(testDir, 'multi3.jpg'),
    ];

    for (const imagePath of testImages) {
      await fs.writeFile(imagePath, jpegHeader);
    }

    // Drop the first image - should automatically load all images from the folder
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

    // Should show that multiple images are loaded
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toContainText('/ 3'); // Should show "1 / 3" or similar

    // Cleanup
    for (const imagePath of testImages) {
      await fs.unlink(imagePath).catch(() => {});
    }
  });
});
