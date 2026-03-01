import { _electron as electron, ElectronApplication, Page } from 'playwright';
import path from 'path';

export class ElectronApp {
  private app: ElectronApplication | null = null;
  private page: Page | null = null;

  async launch() {
    // Launch Electron app (packaged version)
    console.log('Launching Electron app...');
    this.app = await electron.launch({
      executablePath: path.join(__dirname, '..', '..', 'out', 'image-viewer-win32-x64', 'image-viewer.exe'),
    });

    console.log('Waiting for first window...');
    // Get the first window
    this.page = await this.app.firstWindow();
    console.log('Window received, URL:', this.page.url());

    // Wait for page to load
    await this.page.waitForLoadState('domcontentloaded');
    console.log('DOM content loaded');

    // Additional wait for React to mount
    await this.page.waitForTimeout(1000);
    console.log('Page fully loaded');

    return { app: this.app, page: this.page };
  }

  async close() {
    if (this.app) {
      await this.app.close();
    }
  }

  getPage(): Page {
    if (!this.page) {
      throw new Error('Page not initialized. Call launch() first.');
    }
    return this.page;
  }

  getApp(): ElectronApplication {
    if (!this.app) {
      throw new Error('App not initialized. Call launch() first.');
    }
    return this.app;
  }
}
