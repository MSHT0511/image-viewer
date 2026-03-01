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

test.describe('Keyboard Shortcuts Tests', () => {
  test('should zoom in with + key', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const testImage = path.join(testDir, 'zoom-key-test.jpg');
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

    // Check initial zoom level
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');
    await expect(zoomDisplay).toHaveText('100%');

    // Press + to zoom in
    await page.keyboard.press('+');
    await page.waitForTimeout(300);

    // Zoom should increase
    const zoomText = await zoomDisplay.textContent();
    expect(zoomText).not.toBe('100%');
    expect(parseInt(zoomText || '0')).toBeGreaterThan(100);

    // Cleanup
    await fs.unlink(testImage).catch(() => {});
  });

  test('should zoom out with - key', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const testImage = path.join(testDir, 'zoom-out-key-test.jpg');
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

    // Check initial zoom level
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');
    await expect(zoomDisplay).toHaveText('100%');

    // Press - to zoom out
    await page.keyboard.press('-');
    await page.waitForTimeout(300);

    // Zoom should decrease
    const zoomText = await zoomDisplay.textContent();
    expect(zoomText).not.toBe('100%');
    expect(parseInt(zoomText || '0')).toBeLessThan(100);

    // Cleanup
    await fs.unlink(testImage).catch(() => {});
  });

  test('should reset zoom with 0 key', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const testImage = path.join(testDir, 'reset-zoom-test.jpg');
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

    // Zoom in first
    await page.keyboard.press('+');
    await page.keyboard.press('+');
    await page.waitForTimeout(300);

    // Verify we're zoomed in
    let zoomText = await zoomDisplay.textContent();
    expect(parseInt(zoomText || '0')).toBeGreaterThan(100);

    // Reset zoom with 0
    await page.keyboard.press('0');
    await page.waitForTimeout(300);

    // Should be back to 100%
    await expect(zoomDisplay).toHaveText('100%');

    // Cleanup
    await fs.unlink(testImage).catch(() => {});
  });

  test('should navigate with arrow keys', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const testImages = [
      path.join(testDir, 'nav1.jpg'),
      path.join(testDir, 'nav2.jpg'),
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

    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toContainText('1 / 2');

    // Press ArrowRight
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    await expect(toolbar).toContainText('2 / 2');

    // Press ArrowLeft
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(500);
    await expect(toolbar).toContainText('1 / 2');

    // Cleanup
    for (const imagePath of testImages) {
      await fs.unlink(imagePath).catch(() => {});
    }
  });

  test('should support Ctrl+0 for zoom reset', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const testImage = path.join(testDir, 'ctrl-reset-test.jpg');
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

    // Zoom in
    await page.keyboard.press('+');
    await page.waitForTimeout(300);

    // Reset with Ctrl+0
    await page.keyboard.press('Control+0');
    await page.waitForTimeout(300);

    // Should be back to 100%
    await expect(zoomDisplay).toHaveText('100%');

    // Cleanup
    await fs.unlink(testImage).catch(() => {});
  });

  test('should combine multiple keyboard shortcuts', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const testImages = [
      path.join(testDir, 'combo1.jpg'),
      path.join(testDir, 'combo2.jpg'),
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

    const toolbar = page.locator('.toolbar');
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');

    // Start: image 1, zoom 100%
    await expect(toolbar).toContainText('1 / 2');
    await expect(zoomDisplay).toHaveText('100%');

    // Zoom in
    await page.keyboard.press('+');
    await page.waitForTimeout(200);

    // Navigate to next
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await expect(toolbar).toContainText('2 / 2');

    // Zoom should persist
    let zoomText = await zoomDisplay.textContent();
    expect(parseInt(zoomText || '0')).toBeGreaterThan(100);

    // Reset zoom
    await page.keyboard.press('0');
    await page.waitForTimeout(200);
    await expect(zoomDisplay).toHaveText('100%');

    // Navigate back
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    await expect(toolbar).toContainText('1 / 2');

    // Cleanup
    for (const imagePath of testImages) {
      await fs.unlink(imagePath).catch(() => {});
    }
  });
});
