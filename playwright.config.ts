import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Port 3000 hosts the live production site in this environment — the dev/e2e
// server must use 3100 so they never collide.
const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

// Prefer the bundled Playwright browser; fall back to a system Chrome when the
// download is unavailable (the sandbox here ships Chrome but no PW browser).
const SYSTEM_CHROME = [
  process.env.CHROME_PATH,
  "/opt/google/chrome/chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].find((p): p is string => Boolean(p) && existsSync(p as string));

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    // Functional e2e runs with motion collapsed so the experience is
    // deterministic: emulating prefers-reduced-motion disables Lenis (native
    // scroll), the hero stagger, the card pulse/count-up/bar springs, parallax
    // and magnetic effects — every motion path is gated on this preference.
    contextOptions: { reducedMotion: "reduce" },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(SYSTEM_CHROME
          ? { launchOptions: { executablePath: SYSTEM_CHROME, args: ["--no-sandbox"] } }
          : {}),
      },
    },
  ],
  webServer: {
    command: `pnpm exec next dev -p ${PORT}`,
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
