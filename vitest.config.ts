import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["scripts/**/*.test.ts", "packages/maplace/src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcovonly"],
      include: ["packages/maplace/src/**", "scripts/**"],
      // Keep in step with sonar.coverage.exclusions.
      exclude: ["**/__typetests__/**", "**/*.test.ts", "scripts/check.ts"],
    },
  },
});
