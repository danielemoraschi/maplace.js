import { playwright } from "@vitest/browser-playwright";
import { configDefaults, defineConfig } from "vitest/config";
import { MAPS_TEST_PORT } from "./packages/maplace/src/google/testing/maps-origin.ts";
import { MOUSE_COMMANDS } from "./packages/maplace/src/google/testing/mouse-commands.ts";

// What only a real browser shows: layout, scrolling, focus, trusted input, the accessibility tree.
const BROWSER_TESTS = "packages/maplace/src/**/*.browser.test.ts";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcovonly", "json-summary"],
      include: ["packages/maplace/src/**", "scripts/**"],
      // Keep in step with sonar.coverage.exclusions.
      exclude: [
        "**/__typetests__/**",
        "**/*.test.ts",
        "**/src/testing/**",
        "**/src/google/testing/**",
        "scripts/check.ts",
        "scripts/build.ts",
        "scripts/coverage.ts",
        "scripts/checks/consumer/**",
      ],
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
          // Real maps wait on Google's tiles, seconds on a busy runner: a test may poll a few
          // times for TILES_TIMEOUT_MS (15 s) and still fail with its own message.
          testTimeout: 60_000,
          // The origin the Maps tests' key allows. Not strict: runs without a key may use another
          // port when it's taken, and with a key a moved origin fails the origin check.
          api: { port: MAPS_TEST_PORT },
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            commands: MOUSE_COMMANDS,
            instances: [{ browser: "chromium", viewport: { width: 1024, height: 768 } }],
          },
        },
      },
    ],
  },
});
