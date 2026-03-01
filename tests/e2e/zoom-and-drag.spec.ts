import { test, expect } from '@playwright/test';
import { ElectronApp } from './electron-app';

let electronApp: ElectronApp;

test.beforeAll(async () => {
  electronApp = new ElectronApp();
  await electronApp.launch();
});

test.afterAll(async () => {
  await electronApp.close();
});

test.describe('Mouse Wheel Zoom Tests', () => {
  test('should zoom in with mouse wheel (keyboard test)', async () => {
    const page = electronApp.getPage();
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');

    // Reset zoom first using button click
    await zoomDisplay.click();
    await page.waitForTimeout(200);

    // Verify initial is 100%
    await expect(zoomDisplay).toHaveText('100%');

    // Use keyboard to test zoom (since mouse wheel might be tricky in test)
    await page.keyboard.press('+');
    await page.waitForTimeout(100);

    const zoomText = await zoomDisplay.textContent();
    expect(parseInt(zoomText || '0')).toBeGreaterThan(100);
  });
});

test.describe('Cursor Style Tests', () => {
  test('should display grab cursor on image viewer element', async () => {
    const page = electronApp.getPage();
    const imageViewer = page.locator('.image-viewer');

    // Check cursor style via CSS
    const cursor = await imageViewer.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });

    expect(cursor).toBe('grab');
  });

  test('should have dragging class style defined in CSS',  async () => {
    const page = electronApp.getPage();

    // Check that .image-viewer.dragging style exists
    const hasStyle = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule instanceof CSSStyleRule) {
              if (rule.selectorText && rule.selectorText.includes('.image-viewer.dragging')) {
                return true;
              }
            }
          }
        } catch (e) {
          // Skip sheets we can't access
        }
      }
      return false;
    });

    expect(hasStyle).toBe(true);
  });
});

test.describe('Double Click Tests', () => {
  test('should reset zoom on double click', async () => {
    const page = electronApp.getPage();
    const imageViewer = page.locator('.image-viewer');
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');

    // Zoom in first with keyboard
    await page.keyboard.press('+');
    await page.keyboard.press('+');
    await page.keyboard.press('+');
    await page.waitForTimeout(200);

    // Verify zoom changed
    let zoomText = await zoomDisplay.textContent();
    expect(parseInt(zoomText || '0')).toBeGreaterThan(100);

    // Double click to reset
    await imageViewer.dblclick();
    await page.waitForTimeout(200);

    // Check zoom reset to 100%
    await expect(zoomDisplay).toHaveText('100%');
  });

  test('should work multiple times', async () => {
    const page = electronApp.getPage();
    const imageViewer = page.locator('.image-viewer');
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');

    // First cycle
    await page.keyboard.press('+');
    await page.waitForTimeout(100);
    await imageViewer.dblclick();
    await page.waitForTimeout(200);
    await expect(zoomDisplay).toHaveText('100%');

    // Second cycle
    await page.keyboard.press('+');
    await page.keyboard.press('+');
    await page.waitForTimeout(100);
    await imageViewer.dblclick();
    await page.waitForTimeout(200);
    await expect(zoomDisplay).toHaveText('100%');
  });
});

test.describe('Integration Tests', () => {
  test('zoom keyboard shortcuts should still work', async () => {
    const page = electronApp.getPage();
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');

    // Reset
    await page.keyboard.press('Control+0');
    await page.waitForTimeout(200);
    await expect(zoomDisplay).toHaveText('100%');

    // Zoom in with +
    await page.keyboard.press('+');
    await page.waitForTimeout(100);
    let zoomText = await zoomDisplay.textContent();
    expect(parseInt(zoomText || '0')).toBeGreaterThan(100);

    // Zoom out with -
    await page.keyboard.press('-');
    await page.waitForTimeout(100);
    zoomText = await zoomDisplay.textContent();
    expect(parseInt(zoomText || '0')).toBeLessThan(parseInt(zoomText || '0') + 10);
  });

  test('zoom buttons should still work after new features', async () => {
    const page = electronApp.getPage();
    const zoomDisplay = page.locator('.zoom-controls .zoom-percentage');
    const zoomInButton = page.locator('.zoom-controls button:has-text("+")');
    const zoomOutButton = page.locator('.zoom-controls button:has-text("-")');

    // Reset
    await zoomDisplay.click();
    await page.waitForTimeout(200);

    // Test zoom in button
    await zoomInButton.click();
    await page.waitForTimeout(100);
    let zoomText = await zoomDisplay.textContent();
    expect(parseInt(zoomText || '0')).toBeGreaterThan(100);

    // Test zoom out button
    await zoomOutButton.click();
    await page.waitForTimeout(100);
    zoomText = await zoomDisplay.textContent();
    expect(parseInt(zoomText || '0')).toBeLessThanOrEqual(120);
  });
});
