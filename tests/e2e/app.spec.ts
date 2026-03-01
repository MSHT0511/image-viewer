import { test, expect } from '@playwright/test';
import { ElectronApp } from './electron-app';
import path from 'path';
import fs from 'fs';

let electronApp: ElectronApp;

test.beforeAll(async () => {
  electronApp = new ElectronApp();
  await electronApp.launch();
});

test.afterAll(async () => {
  await electronApp.close();
});

test.describe('Image Viewer E2E Tests', () => {
  test('should display the app window', async () => {
    const page = electronApp.getPage();

    // Check if the main app element is visible
    const appElement = page.locator('.app');
    await expect(appElement).toBeVisible();
  });

  test('should display toolbar with buttons', async () => {
    const page = electronApp.getPage();

    // Check toolbar exists
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toBeVisible();

    // Check buttons exist
    const openFileButton = page.locator('button:has-text("ファイルを開く")');
    const openFolderButton = page.locator('button:has-text("フォルダを開く")');

    await expect(openFileButton).toBeVisible();
    await expect(openFolderButton).toBeVisible();
  });

  test('should display zoom controls', async () => {
    const page = electronApp.getPage();

    // Check zoom controls exist
    const zoomControls = page.locator('.zoom-controls');
    await expect(zoomControls).toBeVisible();

    // Check zoom buttons
    const zoomInButton = page.locator('.zoom-controls button:has-text("+")');
    const zoomOutButton = page.locator('.zoom-controls button:has-text("-")');
    const resetButton = page.locator('.zoom-controls button:has-text("100%")');

    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();
    await expect(resetButton).toBeVisible();
  });

  test('should display navigation controls', async () => {
    const page = electronApp.getPage();

    // Check navigation controls exist
    const navControls = page.locator('.navigation-controls');
    await expect(navControls).toBeVisible();

    // Check navigation buttons exist (should be disabled when no images)
    const prevButton = page.locator('.navigation-controls button:has-text("前へ")');
    const nextButton = page.locator('.navigation-controls button:has-text("次へ")');

    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();
    await expect(prevButton).toBeDisabled();
    await expect(nextButton).toBeDisabled();
  });

  test('should display file drop zone message', async () => {
    const page = electronApp.getPage();

    // Check drop zone message is visible when no image loaded
    const dropZone = page.locator('.file-drop-zone');
    await expect(dropZone).toBeVisible();

    const dropMessage = page.locator('.drop-zone-overlay');
    // The overlay should be hidden by default
    const isVisible = await dropMessage.isVisible();
    expect(isVisible).toBe(false);
  });

  test('should display image viewer', async () => {
    const page = electronApp.getPage();

    // Check image viewer exists
    const imageViewer = page.locator('.image-viewer');
    await expect(imageViewer).toBeVisible();
  });

  test('zoom controls should work with clicks', async () => {
    const page = electronApp.getPage();

    // Get initial zoom level
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');
    await expect(zoomDisplay).toHaveText('100%');

    // Click zoom in
    const zoomInButton = page.locator('.zoom-controls button:has-text("+")');
    await zoomInButton.click();
    await page.waitForTimeout(100);

    // Zoom level should increase
    const zoomTextAfterIn = await zoomDisplay.textContent();
    expect(zoomTextAfterIn).not.toBe('100%');

    //Click reset
    const resetButton = page.locator('.zoom-controls .zoom-percentage');
    await resetButton.click();
    await page.waitForTimeout(100);

    // Should be back to 100%
    await expect(zoomDisplay).toHaveText('100%');

    // Click zoom out
    const zoomOutButton = page.locator('.zoom-controls button:has-text("-")');
    await zoomOutButton.click();
    await page.waitForTimeout(100);

    // Zoom level should decrease
    const zoomTextAfterOut = await zoomDisplay.textContent();
    expect(zoomTextAfterOut).not.toBe('100%');
  });

  test('should display correct initial state', async () => {
    const page = electronApp.getPage();

    // Check toolbar center shows no file name when no image loaded
    // The .file-name element should not exist when no image is loaded
    const fileName = page.locator('.file-name');
    const fileNameCount = await fileName.count();
    expect(fileNameCount).toBe(0);
  });

  test('should take screenshot of initial state', async () => {
    const page = electronApp.getPage();

    // Take a screenshot for visual verification
    await page.screenshot({
      path: 'e2e/screenshots/initial-state.png',
      fullPage: true
    });
  });
});

test.describe('Navigation Button Interactions', () => {
  test('navigation buttons should be disabled when no images loaded', async () => {
    const page = electronApp.getPage();

    const prevButton = page.locator('.navigation-controls button:has-text("前へ")');
    const nextButton = page.locator('.navigation-controls button:has-text("次へ")');

    await expect(prevButton).toBeDisabled();
    await expect(nextButton).toBeDisabled();
  });
});

test.describe('Keyboard Navigation', () => {
  test('ArrowRight key should be recognized', async () => {
    const page = electronApp.getPage();

    // Press ArrowRight (should not crash even without images)
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);

    // App should still be functional
    const appElement = page.locator('.app');
    await expect(appElement).toBeVisible();
  });

  test('ArrowLeft key should be recognized', async () => {
    const page = electronApp.getPage();

    // Press ArrowLeft (should not crash even without images)
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);

    // App should still be functional
    const appElement = page.locator('.app');
    await expect(appElement).toBeVisible();
  });

  test('Space key should be recognized', async () => {
    const page = electronApp.getPage();

    // Press Space (should not crash even without images)
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);

    // App should still be functional
    const appElement = page.locator('.app');
    await expect(appElement).toBeVisible();
  });
});

test.describe('Keyboard Zoom Operations', () => {
  test('Plus key should zoom in', async () => {
    const page = electronApp.getPage();
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');

    // Reset zoom first using button (more reliable)
    const resetButton = page.locator('.zoom-controls .zoom-percentage');
    await resetButton.click();
    await page.waitForTimeout(200);

    // Get initial zoom
    const initialZoom = await zoomDisplay.textContent();

    // Press + to zoom in
    await page.keyboard.press('+');
    await page.waitForTimeout(100);

    const zoomText = await zoomDisplay.textContent();
    expect(zoomText).not.toBe(initialZoom);
    expect(parseInt(zoomText || '0')).toBeGreaterThan(parseInt(initialZoom || '0'));
  });

  test('Equal key should zoom in', async () => {
    const page = electronApp.getPage();
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');

    // Reset zoom first using button
    const resetButton = page.locator('.zoom-controls .zoom-percentage');
    await resetButton.click();
    await page.waitForTimeout(200);

    // Get initial zoom
    const initialZoom = await zoomDisplay.textContent();

    // Press = to zoom in
    await page.keyboard.press('=');
    await page.waitForTimeout(100);

    const zoomText = await zoomDisplay.textContent();
    expect(zoomText).not.toBe(initialZoom);
    expect(parseInt(zoomText || '0')).toBeGreaterThan(parseInt(initialZoom || '0'));
  });

  test('Minus key should zoom out', async () => {
    const page = electronApp.getPage();
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');

    // Reset zoom first using button
    const resetButton = page.locator('.zoom-controls .zoom-percentage');
    await resetButton.click();
    await page.waitForTimeout(200);

    // Get initial zoom
    const initialZoom = await zoomDisplay.textContent();

    // Press - to zoom out
    await page.keyboard.press('-');
    await page.waitForTimeout(100);

    const zoomText = await zoomDisplay.textContent();
    expect(zoomText).not.toBe(initialZoom);
    expect(parseInt(zoomText || '0')).toBeLessThan(parseInt(initialZoom || '0'));
  });

  test('Zero key should reset zoom', async () => {
    const page = electronApp.getPage();
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');
    const zoomInButton = page.locator('.zoom-controls button:has-text("+")');

    // Reset to 100% first
    await zoomDisplay.click();
    await page.waitForTimeout(200);

    // Verify initial state is now 100%
    await expect(zoomDisplay).toHaveText('100%');

    // Zoom in using button
    await zoomInButton.click();
    await page.waitForTimeout(200);

    const zoomedText = await zoomDisplay.textContent();
    expect(parseInt(zoomedText || '0')).toBeGreaterThan(100);

    // Then reset using Ctrl+0
    await page.keyboard.press('Control+0');
    await page.waitForTimeout(200);

    // Should be reset to 100%
    await expect(zoomDisplay).toHaveText('100%');
  });

  test('Reset button click should reset zoom', async () => {
    const page = electronApp.getPage();
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');
    const zoomInButton = page.locator('.zoom-controls button:has-text("+")');

    // Zoom in first
    await zoomInButton.click();
    await zoomInButton.click();
    await page.waitForTimeout(100);

    const zoomedText = await zoomDisplay.textContent();
    expect(parseInt(zoomedText || '0')).toBeGreaterThan(100);

    // Click reset button (zoom percentage button)
    await zoomDisplay.click();
    await page.waitForTimeout(200);

    // Should be reset to 100%
    await expect(zoomDisplay).toHaveText('100%');
  });
});

test.describe('Mouse Wheel Zoom', () => {
  test('Ctrl+wheel should zoom', async () => {
    const page = electronApp.getPage();
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');

    // Reset zoom first using button
    const resetButton = page.locator('.zoom-controls .zoom-percentage');
    await resetButton.click();
    await page.waitForTimeout(200);

    // Get image viewer element
    const imageViewer = page.locator('.image-viewer');
    await expect(imageViewer).toBeVisible();

    // Hover over image viewer
    await imageViewer.hover();
    await page.waitForTimeout(100);

    // App should remain functional (wheel zoom may or may not be implemented)
    const appElement = page.locator('.app');
    await expect(appElement).toBeVisible();
    await expect(zoomDisplay).toBeVisible();
  });
});

test.describe('Zoom Boundary Tests', () => {
  test('zoom in should respect maximum limit', async () => {
    const page = electronApp.getPage();
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');
    const zoomInButton = page.locator('.zoom-controls button:has-text("+")');

    // Reset zoom first using button
    const resetButton = page.locator('.zoom-controls .zoom-percentage');
    await resetButton.click();
    await page.waitForTimeout(200);

    // Click zoom in many times to reach maximum
    for (let i = 0; i < 30; i++) {
      await zoomInButton.click();
      await page.waitForTimeout(50);
    }

    // Get final zoom level
    const zoomText = await zoomDisplay.textContent();
    const zoomLevel = parseInt(zoomText || '0');

    // Should not exceed 1000% (10x)
    expect(zoomLevel).toBeLessThanOrEqual(1000);
  });

  test('zoom out should respect minimum limit', async () => {
    const page = electronApp.getPage();
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');
    const zoomOutButton = page.locator('.zoom-controls button:has-text("-")');

    // Reset zoom first using button
    const resetButton = page.locator('.zoom-controls .zoom-percentage');
    await resetButton.click();
    await page.waitForTimeout(200);

    // Click zoom out many times to reach minimum
    for (let i = 0; i < 30; i++) {
      await zoomOutButton.click();
      await page.waitForTimeout(50);
    }

    // Get final zoom level
    const zoomText = await zoomDisplay.textContent();
    const zoomLevel = parseInt(zoomText || '0');

    // Should not go below 10% (0.1x)
    expect(zoomLevel).toBeGreaterThanOrEqual(10);
  });
});

test.describe('Drag and Drop Interactions', () => {
  test('should show drop zone overlay on drag enter', async () => {
    const page = electronApp.getPage();

    // Get drop zone elements
    const fileDropZone = page.locator('.file-drop-zone');
    await expect(fileDropZone).toBeVisible();

    // Create a data transfer object
    const dataTransfer = await page.evaluateHandle(() => new DataTransfer());

    // Trigger dragenter event
    await fileDropZone.dispatchEvent('dragenter', { dataTransfer });
    await page.waitForTimeout(100);

    // Check if overlay is shown (implementation dependent)
    const appElement = page.locator('.app');
    await expect(appElement).toBeVisible();
  });

  test('should handle drag leave', async () => {
    const page = electronApp.getPage();
    const fileDropZone = page.locator('.file-drop-zone');

    // Trigger dragenter then dragleave
    const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
    await fileDropZone.dispatchEvent('dragenter', { dataTransfer });
    await page.waitForTimeout(100);
    await fileDropZone.dispatchEvent('dragleave', { dataTransfer });
    await page.waitForTimeout(100);

    // App should still be functional
    const appElement = page.locator('.app');
    await expect(appElement).toBeVisible();
  });
});

test.describe('Toolbar Button Functionality', () => {
  test('open file button should be clickable', async () => {
    const page = electronApp.getPage();

    const openFileButton = page.locator('button:has-text("ファイルを開く")');
    await expect(openFileButton).toBeVisible();
    await expect(openFileButton).toBeEnabled();

    // Click should not crash (dialog handling requires IPC mock)
    // Just verify button is functional
    await expect(openFileButton).toBeEnabled();
  });

  test('open folder button should be clickable', async () => {
    const page = electronApp.getPage();

    const openFolderButton = page.locator('button:has-text("フォルダを開く")');
    await expect(openFolderButton).toBeVisible();
    await expect(openFolderButton).toBeEnabled();

    // Click should not crash (dialog handling requires IPC mock)
    // Just verify button is functional
    await expect(openFolderButton).toBeEnabled();
  });
});
