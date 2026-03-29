import { Injectable, Logger, OnApplicationShutdown } from "@nestjs/common";
import { launch, type Browser, type BrowserContext } from "puppeteer";

@Injectable()
export class SharedBrowserService implements OnApplicationShutdown {
  readonly #logger = new Logger(SharedBrowserService.name);

  // this acts as a lock to prevent race conditions if multiple scrapers start at the same time and try to launch the browser
  #launchPromise: Promise<Browser> | null = null;
  #browser: Browser | null = null;
  #activeContexts = 0;

  /**
   * Called by a scraper when it starts. Ensures the browser is running and returns a completely isolated browser context.
   */
  async acquireContext(): Promise<BrowserContext> {
    const browser = await this.#getOrLaunchBrowser();
    this.#activeContexts++;
    this.#logger.log("Creating isolated context. Active contexts: " + this.#activeContexts);
    return browser.createBrowserContext();
  }

  /**
   * Called by a scraper when it finishes. Closes the browser context and cleans up the browser if no contexts are left.
   */
  async releaseContext(context: BrowserContext): Promise<void> {
    this.#logger.log("Closing isolated context...");
    try {
      await context.close();
      this.#logger.log("Context closed.");
    } catch (e) {
      this.#logger.error("Error closing context", e);
    }
    this.#activeContexts--;
    this.#logger.log("Active contexts left: " + this.#activeContexts);

    if (this.#activeContexts <= 0) {
      this.#activeContexts = 0;

      if (this.#browser) {
        this.#logger.log("No active contexts. Closing the browser...");
        try {
          await this.#browser.close();
          this.#logger.log("Browser closed.");
        } catch (e) {
          this.#logger.error("Error closing browser", e);
        }
        this.#browser = null;
      }
    }
  }

  async #getOrLaunchBrowser(): Promise<Browser> {
    // check if the browser is already running
    if (this.#browser) {
      return this.#browser;
    }

    // check if a launch is already in progress
    if (this.#launchPromise) {
      return this.#launchPromise;
    }

    // the first caller must launch the browser
    this.#launchPromise = this.#launchBrowser();
    return this.#launchPromise;
  }

  async #launchBrowser(): Promise<Browser> {
    try {
      this.#logger.log("Launching new Puppeteer browser instance...");
      this.#browser = await launch({
        headless: true,
        defaultViewport: { height: 1000, width: 1500 },
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          // prevent issues related to shared memory when running in Docker
          "--disable-dev-shm-usage",
          // other settings
          "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        ],
      });

      this.#browser.on("disconnected", () => {
        this.#browser = null;
        this.#launchPromise = null;
        this.#activeContexts = 0;
      });

      return this.#browser;
    } finally {
      // clear the lock so future calls can try again
      this.#launchPromise = null;
    }
  }

  async onApplicationShutdown() {
    if (this.#browser) {
      this.#logger.log("Closing the browser...");
      try {
        await this.#browser.close();
        this.#logger.log("Browser closed.");
      } catch (e) {
        this.#logger.error("Error closing browser", e);
      }
      this.#browser = null;
    }
  }
}
