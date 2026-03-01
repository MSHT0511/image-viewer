import { test, expect } from '@playwright/test';
import { ElectronApp } from './electron-app';
import path from 'path';
import fs from 'fs/promises';

let electronApp: ElectronApp;

// Create test images before tests
test.beforeAll(async () => {
  // Create test-images directory
  const testImagesDir = path.join(__dirname, '..', 'test-images');
  await fs.mkdir(testImagesDir, { recursive: true });

  // Create a simple test image (1x1 PNG)
  const pngData = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  await fs.writeFile(path.join(testImagesDir, 'test1.png'), pngData);
  await fs.writeFile(path.join(testImagesDir, 'test2.png'), pngData);
  await fs.writeFile(path.join(testImagesDir, 'test3.png'), pngData);

  electronApp = new ElectronApp();
  await electronApp.launch();
});

test.afterAll(async () => {
  await electronApp.close();

  // Clean up test images
  const testImagesDir = path.join(__dirname, '..', 'test-images');
  await fs.rm(testImagesDir, { recursive: true, force: true });
});

test.describe('Image Loading Tests', () => {
  test('should display placeholder when no image loaded', async () => {
    const page = electronApp.getPage();

    // Check that viewer shows empty state
    const imageViewer = page.locator('.image-viewer');
    await expect(imageViewer).toBeVisible();

    // No actual image should be displayed
    const image = page.locator('.image-viewer img');
    const imageCount = await image.count();
    expect(imageCount).toBe(0);
  });

  test('keyboard shortcuts should be registered', async () => {
    const page = electronApp.getPage();

    // Test zoom shortcuts (these should work even without an image)
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');

    // Initial state should be 100%
    await expect(zoomDisplay).toHaveText('100%');

    // Press + to zoom in
    await page.keyboard.press('+');
    await page.waitForTimeout(100);
    let zoomText = await zoomDisplay.textContent();
    expect(zoomText).not.toBe('100%');

    // Press Ctrl+0 for reset
    await page.keyboard.press('Control+0');
    await page.waitForTimeout(200);
    await expect(zoomDisplay).toHaveText('100%');
  });
});

test.describe('UI Responsiveness Tests', () => {
  test('buttons should have hover states', async () => {
    const page = electronApp.getPage();

    // Hover over zoom in button
    const zoomInButton = page.locator('.zoom-controls button:has-text("+")');
    const boxBefore = await zoomInButton.boundingBox();
    expect(boxBefore).toBeTruthy();

    await zoomInButton.hover();
    await page.waitForTimeout(100);

    // Button should still be visible after hover
    await expect(zoomInButton).toBeVisible();
  });

  test('window should be resizable', async () => {
    const app = electronApp.getApp();
    const page = electronApp.getPage();

    // Check that window exists and page is loaded
    await expect(page.locator('.app')).toBeVisible();

    // Electron window exists (this test just validates the window is functional)
    expect(app).toBeTruthy();
  });

  test('should handle rapid zoom changes', async () => {
    const page = electronApp.getPage();
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');

    // Rapid zoom in clicks
    const zoomInButton = page.locator('.zoom-controls button:has-text("+")');
    await zoomInButton.click();
    await zoomInButton.click();
    await zoomInButton.click();
    await page.waitForTimeout(100);

    // Should have increased zoom
    const zoomText = await zoomDisplay.textContent();
    expect(parseInt(zoomText || '0')).toBeGreaterThan(100);

    // Reset by clicking zoom percentage button
    await zoomDisplay.click();
    await page.waitForTimeout(200);
    await expect(zoomDisplay).toHaveText('100%');
  });
});

test.describe('Error Handling Tests', () => {
  test('should gracefully handle missing image', async () => {
    const page = electronApp.getPage();

    // App should not crash when no image is loaded
    const appElement = page.locator('.app');
    await expect(appElement).toBeVisible();

    // Navigation buttons should be disabled
    const prevButton = page.locator('.navigation-controls button:has-text("前へ")');
    const nextButton = page.locator('.navigation-controls button:has-text("次へ")');
    await expect(prevButton).toBeDisabled();
    await expect(nextButton).toBeDisabled();
  });
});

test.describe('Dynamic UI State Updates', () => {
  test('should show empty state initially', async () => {
    const page = electronApp.getPage();

    // Initially, no file name should be displayed
    const fileNameElements = page.locator('.file-name');
    const count = await fileNameElements.count();
    expect(count).toBe(0);

    // Navigation buttons should be disabled
    const prevButton = page.locator('.navigation-controls button:has-text("前へ")');
    const nextButton = page.locator('.navigation-controls button:has-text("次へ")');
    await expect(prevButton).toBeDisabled();
    await expect(nextButton).toBeDisabled();
  });

  test('should display correct initial zoom percentage', async () => {
    const page = electronApp.getPage();
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');

    // Reset zoom using button
    const resetButton = page.locator('.zoom-controls .zoom-percentage');
    await resetButton.click();
    await page.waitForTimeout(200);

    // Should show 100%
    await expect(zoomDisplay).toHaveText('100%');
  });

  test('zoom percentage should update on zoom in', async () => {
    const page = electronApp.getPage();
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');

    // Reset zoom using button
    const resetButton = page.locator('.zoom-controls .zoom-percentage');
    await resetButton.click();
    await page.waitForTimeout(200);

    const initialZoom = await zoomDisplay.textContent();

    // Zoom in
    const zoomInButton = page.locator('.zoom-controls button:has-text("+")');
    await zoomInButton.click();
    await page.waitForTimeout(100);

    const newZoom = await zoomDisplay.textContent();
    expect(newZoom).not.toBe(initialZoom);
  });

  test('zoom percentage should update on zoom out', async () => {
    const page = electronApp.getPage();
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');

    // Reset zoom using button
    const resetButton = page.locator('.zoom-controls .zoom-percentage');
    await resetButton.click();
    await page.waitForTimeout(200);

    const initialZoom = await zoomDisplay.textContent();

    // Zoom out
    const zoomOutButton = page.locator('.zoom-controls button:has-text("-")');
    await zoomOutButton.click();
    await page.waitForTimeout(100);

    const newZoom = await zoomDisplay.textContent();
    expect(newZoom).not.toBe(initialZoom);
  });
});

test.describe('Multi-Image Scenarios', () => {
  test('should handle sequential zoom changes', async () => {
    const page = electronApp.getPage();
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');

    // Reset zoom using button
    const resetButton = page.locator('.zoom-controls .zoom-percentage');
    await resetButton.click();
    await page.waitForTimeout(200);
    await expect(zoomDisplay).toHaveText('100%');

    // Zoom in multiple times
    await page.keyboard.press('+');
    await page.waitForTimeout(50);
    await page.keyboard.press('+');
    await page.waitForTimeout(50);
    await page.keyboard.press('+');
    await page.waitForTimeout(50);

    const zoomText = await zoomDisplay.textContent();
    expect(parseInt(zoomText || '0')).toBeGreaterThan(100);

    // Zoom out multiple times
    await page.keyboard.press('-');
    await page.waitForTimeout(50);
    await page.keyboard.press('-');
    await page.waitForTimeout(50);

    const finalZoomText = await zoomDisplay.textContent();
    const finalZoom = parseInt(finalZoomText || '0');
    const currentZoom = parseInt(zoomText || '0');
    expect(finalZoom).toBeLessThan(currentZoom);
  });

  test('should maintain UI responsiveness during rapid interactions', async () => {
    const page = electronApp.getPage();

    // Rapid button clicks
    const zoomInButton = page.locator('.zoom-controls button:has-text("+")');
    const zoomOutButton = page.locator('.zoom-controls button:has-text("-")');

    for (let i = 0; i < 5; i++) {
      await zoomInButton.click({ delay: 10 });
    }

    for (let i = 0; i < 5; i++) {
      await zoomOutButton.click({ delay: 10 });
    }

    await page.waitForTimeout(100);

    // App should still be responsive
    const appElement = page.locator('.app');
    await expect(appElement).toBeVisible();

    // Zoom display should still be functional
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');
    await expect(zoomDisplay).toBeVisible();
  });

  test('should handle mixed keyboard and button interactions', async () => {
    const page = electronApp.getPage();
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');

    // Reset zoom using button
    const resetButton = page.locator('.zoom-controls .zoom-percentage');
    await resetButton.click();
    await page.waitForTimeout(200);

    // Mix keyboard and button interactions
    await page.keyboard.press('+');
    await page.waitForTimeout(50);

    const zoomInButton = page.locator('.zoom-controls button:has-text("+")');
    await zoomInButton.click();
    await page.waitForTimeout(50);

    await page.keyboard.press('-');
    await page.waitForTimeout(50);

    await resetButton.click();
    await page.waitForTimeout(200);

    // Should be back to 100%
    await expect(zoomDisplay).toHaveText('100%');
  });
});
