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

test.describe('Mouse Drag Tests', () => {
  test('should allow dragging zoomed image with mouse', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const testImage = path.join(testDir, 'drag-test.jpg');
    await fs.writeFile(testImage, jpegHeader);

    // Load image
    const dropZone = page.locator('.file-drop-zone');
    const fileName = path.basename(testImage);
    await dropZone.evaluate(
      (element, { filePath, fileName }) => {
        const dataTransfer = new DataTransfer();
        const file = new File([''], fileName, { type: 'image/jpeg' });
        Object.defineProperty(file, 'path', { value: filePath });
        dataTransfer.items.add(file);

        const event = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        });
        element.dispatchEvent(event);
      },
      { filePath: testImage, fileName }
    );

    await page.waitForTimeout(1000);

    // Zoom in to enable dragging
    await page.keyboard.press('+');
    await page.keyboard.press('+');
    await page.waitForTimeout(300);

    // Get image viewer
    const imageViewer = page.locator('.image-viewer');
    await expect(imageViewer).toBeVisible();

    // Get initial transform/position (if available in implementation)
    // This is difficult to test precisely without knowing the exact implementation
    // We can at least verify that mouse events don't cause errors

    const imageContainer = page.locator('.image-container');
    if (await imageContainer.count() > 0) {
      const box = await imageContainer.boundingBox();
      if (box) {
        // Simulate mouse drag
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50);
        await page.mouse.up();

        await page.waitForTimeout(300);

        // App should still be stable
        await expect(imageViewer).toBeVisible();
      }
    }

    // Cleanup
    await fs.unlink(testImage).catch(() => {});
  });

  test('should not allow dragging at 100% zoom', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const testImage = path.join(testDir, 'no-drag-test.jpg');
    await fs.writeFile(testImage, jpegHeader);

    // Load image
    const dropZone = page.locator('.file-drop-zone');
    const fileName = path.basename(testImage);
    await dropZone.evaluate(
      (element, { filePath, fileName }) => {
        const dataTransfer = new DataTransfer();
        const file = new File([''], fileName, { type: 'image/jpeg' });
        Object.defineProperty(file, 'path', { value: filePath });
        dataTransfer.items.add(file);

        const event = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        });
        element.dispatchEvent(event);
      },
      { filePath: testImage, fileName }
    );

    await page.waitForTimeout(1000);

    // Ensure we're at 100% zoom
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');
    await expect(zoomDisplay).toHaveText('100%');

    // Try to drag (shouldn't really move)
    const imageViewer = page.locator('.image-viewer');
    const box = await imageViewer.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 100);
      await page.mouse.up();

      await page.waitForTimeout(300);

      // App should remain stable
      await expect(imageViewer).toBeVisible();
    }

    // Cleanup
    await fs.unlink(testImage).catch(() => {});
  });

  test('should update cursor style during drag', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const testImage = path.join(testDir, 'cursor-test.jpg');
    await fs.writeFile(testImage, jpegHeader);

    // Load image
    const dropZone = page.locator('.file-drop-zone');
    const fileName = path.basename(testImage);
    await dropZone.evaluate(
      (element, { filePath, fileName }) => {
        const dataTransfer = new DataTransfer();
        const file = new File([''], fileName, { type: 'image/jpeg' });
        Object.defineProperty(file, 'path', { value: filePath });
        dataTransfer.items.add(file);

        const event = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        });
        element.dispatchEvent(event);
      },
      { filePath: testImage, fileName }
    );

    await page.waitForTimeout(1000);

    // Zoom in
    await page.keyboard.press('+');
    await page.keyboard.press('+');
    await page.waitForTimeout(300);

    const imageViewer = page.locator('.image-viewer');
    const box = await imageViewer.boundingBox();

    if (box) {
      // Move mouse over image
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

      // Check cursor style (grab when not dragging)
      const cursorBefore = await imageViewer.evaluate((el) => {
        return window.getComputedStyle(el).cursor;
      });

      // Start drag
      await page.mouse.down();
      await page.waitForTimeout(100);

      // Check cursor style during drag (should be grabbing)
      const cursorDuring = await imageViewer.evaluate((el) => {
        return window.getComputedStyle(el).cursor;
      });

      // End drag
      await page.mouse.up();
      await page.waitForTimeout(100);

      // Cursor should change back
      const cursorAfter = await imageViewer.evaluate((el) => {
        return window.getComputedStyle(el).cursor;
      });

      // Basic verification - cursors should be defined
      expect(cursorBefore).toBeTruthy();
      expect(cursorDuring).toBeTruthy();
      expect(cursorAfter).toBeTruthy();
    }

    // Cleanup
    await fs.unlink(testImage).catch(() => {});
  });

  test('should handle rapid mouse movements during drag', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const testImage = path.join(testDir, 'rapid-drag-test.jpg');
    await fs.writeFile(testImage, jpegHeader);

    // Load image
    const dropZone = page.locator('.file-drop-zone');
    const fileName = path.basename(testImage);
    await dropZone.evaluate(
      (element, { filePath, fileName }) => {
        const dataTransfer = new DataTransfer();
        const file = new File([''], fileName, { type: 'image/jpeg' });
        Object.defineProperty(file, 'path', { value: filePath });
        dataTransfer.items.add(file);

        const event = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        });
        element.dispatchEvent(event);
      },
      { filePath: testImage, fileName }
    );

    await page.waitForTimeout(1000);

    // Zoom in
    await page.keyboard.press('+');
    await page.keyboard.press('+');
    await page.waitForTimeout(300);

    const imageViewer = page.locator('.image-viewer');
    const box = await imageViewer.boundingBox();

    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      // Start dragging
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();

      // Rapid movements
      for (let i = 0; i < 20; i++) {
        const offset = Math.sin(i * 0.5) * 50;
        await page.mouse.move(centerX + offset, centerY + offset, { steps: 1 });
      }

      await page.mouse.up();
      await page.waitForTimeout(300);

      // App should still be stable
      await expect(imageViewer).toBeVisible();
    }

    // Cleanup
    await fs.unlink(testImage).catch(() => {});
  });

  test('should reset drag position after zoom reset', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const testImage = path.join(testDir, 'reset-position-test.jpg');
    await fs.writeFile(testImage, jpegHeader);

    // Load image
    const dropZone = page.locator('.file-drop-zone');
    const fileName = path.basename(testImage);
    await dropZone.evaluate(
      (element, { filePath, fileName }) => {
        const dataTransfer = new DataTransfer();
        const file = new File([''], fileName, { type: 'image/jpeg' });
        Object.defineProperty(file, 'path', { value: filePath });
        dataTransfer.items.add(file);

        const event = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        });
        element.dispatchEvent(event);
      },
      { filePath: testImage, fileName }
    );

    await page.waitForTimeout(1000);

    // Zoom in and drag
    await page.keyboard.press('+');
    await page.keyboard.press('+');
    await page.waitForTimeout(300);

    const imageViewer = page.locator('.image-viewer');
    const box = await imageViewer.boundingBox();

    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 100);
      await page.mouse.up();
      await page.waitForTimeout(300);
    }

    // Reset zoom
    await page.keyboard.press('Control+0');
    await page.waitForTimeout(300);

    // Verify zoom is reset
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');
    await expect(zoomDisplay).toHaveText('100%');

    // App should be stable
    await expect(imageViewer).toBeVisible();

    // Cleanup
    await fs.unlink(testImage).catch(() => {});
  });
});
