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

test.describe('Navigation Tests', () => {
  test('should navigate between multiple images using buttons', async () => {
    const page = electronApp.getPage();

    // Create test images directory if not exists
    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    // Create mock JPEG files (simple valid JPEG structure)
    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const testImages = [
      path.join(testDir, 'test1.jpg'),
      path.join(testDir, 'test2.jpg'),
      path.join(testDir, 'test3.jpg'),
    ];

    for (const imagePath of testImages) {
      await fs.writeFile(imagePath, jpegHeader);
    }

    // Simulate drag and drop first image
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

    // Wait for image to load
    await page.waitForTimeout(1000);

    // Check initial state - should show image 1 of 3
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toContainText('1 / 3');

    // Click next button
    const nextButton = page.locator('.navigation-controls button:has-text("次へ")');
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    await page.waitForTimeout(500);

    // Should show image 2 of 3
    await expect(toolbar).toContainText('2 / 3');

    // Click next again
    await nextButton.click();
    await page.waitForTimeout(500);

    // Should show image 3 of 3
    await expect(toolbar).toContainText('3 / 3');

    // Click next again to loop back to first
    await nextButton.click();
    await page.waitForTimeout(500);

    // Should show image 1 of 3
    await expect(toolbar).toContainText('1 / 3');

    // Click previous button
    const prevButton = page.locator('.navigation-controls button:has-text("前へ")');
    await expect(prevButton).toBeEnabled();
    await prevButton.click();
    await page.waitForTimeout(500);

    // Should loop to image 3 of 3
    await expect(toolbar).toContainText('3 / 3');

    // Cleanup
    for (const imagePath of testImages) {
      await fs.unlink(imagePath).catch(() => {});
    }
  });

  test('should navigate using arrow keys', async () => {
    const page = electronApp.getPage();

    // Create test images
    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const testImages = [
      path.join(testDir, 'arrow1.jpg'),
      path.join(testDir, 'arrow2.jpg'),
    ];

    for (const imagePath of testImages) {
      await fs.writeFile(imagePath, jpegHeader);
    }

    // Simulate drag and drop first image
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

    // Check initial state
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toContainText('1 / 2');

    // Press ArrowRight to go to next image
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    await expect(toolbar).toContainText('2 / 2');

    // Press ArrowLeft to go back
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(500);
    await expect(toolbar).toContainText('1 / 2');

    // Cleanup
    for (const imagePath of testImages) {
      await fs.unlink(imagePath).catch(() => {});
    }
  });

  test('should display correct filename in toolbar', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const testImage = path.join(testDir, 'my-test-image.jpg');
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

    // Check that filename is displayed
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toContainText('my-test-image.jpg');

    // Cleanup
    await fs.unlink(testImage).catch(() => {});
  });

  test('should handle single image without looping', async () => {
    const page = electronApp.getPage();

    const testDir = path.join(__dirname, '../fixtures/images');
    await fs.mkdir(testDir, { recursive: true });

    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const testImage = path.join(testDir, 'single.jpg');
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

    // Check initial state - should show 1 / 1
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toContainText('1 / 1');

    // Navigation buttons should still be enabled (they loop)
    const nextButton = page.locator('.navigation-controls button:has-text("次へ")');
    const prevButton = page.locator('.navigation-controls button:has-text("前へ")');
    await expect(nextButton).toBeEnabled();
    await expect(prevButton).toBeEnabled();

    // Click next - should stay on same image
    await nextButton.click();
    await page.waitForTimeout(500);
    await expect(toolbar).toContainText('1 / 1');

    // Cleanup
    await fs.unlink(testImage).catch(() => {});
  });
});
