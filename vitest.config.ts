import { playwright } from "@vitest/browser-playwright";
import { configDefaults, defineConfig } from "vitest/config";

// What only a real browser shows: layout, scrolling, focus, trusted input, the accessibility tree.
const BROWSER_TESTS = "packages/maplace/src/**/*.browser.test.ts";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcovonly"],
      include: ["packages/maplace/src/**", "scripts/**"],
      // Keep in step with sonar.coverage.exclusions.
      exclude: ["**/__typetests__/**", "**/*.test.ts", "**/src/testing/**", "scripts/check.ts"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          include: ["scripts/**/*.test.ts", "packages/maplace/src/**/*.test.ts"],
          exclude: [...configDefaults.exclude, BROWSER_TESTS],
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: [BROWSER_TESTS],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium", viewport: { width: 1024, height: 768 } }],
          },
        },
      },
    ],
  },
});
