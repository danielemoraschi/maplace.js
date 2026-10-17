import { playwright } from "@vitest/browser-playwright";
import { defaultClientConditions } from "vite";
import { configDefaults, defineConfig } from "vitest/config";
import { MAPS_TEST_PORT } from "./packages/maplace/src/google/testing/maps-origin.ts";
import { MOUSE_COMMANDS } from "./packages/maplace/src/google/testing/mouse-commands.ts";

// What only a real browser shows: layout, scrolling, focus, trusted input, the accessibility tree.
const BROWSER_TESTS = "packages/maplace/src/**/*.browser.test.{ts,tsx}";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcovonly", "json-summary"],
      include: ["packages/maplace/src/**", "scripts/**", "apps/site/src/**"],
      // Keep in step with sonar.coverage.exclusions.
      exclude: [
        "**/__typetests__/**",
        "**/*.test.{ts,tsx}",
        "**/src/testing/**",
        "**/src/google/testing/**",
        "**/src/react/testing/**",
        // The command-line entry points: their logic is in the folders below, tested there.
        "scripts/*.ts",
        "scripts/checks/consumer/**",
        // The site's pages, content config and page script arrange what its tested modules do.
        "apps/site/src/**/*.astro",
        "apps/site/src/content.config.ts",
        "apps/site/src/scripts/site.ts",
      ],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          include: [
            "scripts/**/*.test.ts",
            "packages/maplace/src/**/*.test.{ts,tsx}",
            "apps/site/{src,test}/**/*.test.ts",
          ],
          exclude: [...configDefaults.exclude, BROWSER_TESTS],
        },
      },
      {
        extends: true,
        // The examples import `maplace` by name, as readers do: resolved to the source, as in tsconfig.
        resolve: { conditions: ["maplace:source", ...defaultClientConditions] },
        // React pre-bundled from the start: a dependency Vite finds mid-run is optimized and
        // reloaded, and a component holding the old copy breaks the hooks of the new.
        optimizeDeps: {
          include: ["react", "react/jsx-dev-runtime", "react-dom", "react-dom/client"],
        },
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
