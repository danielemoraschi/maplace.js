import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["kit-run/adapter-run.ts"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      // Wider than the 512×512 the suite draws at, or its maps overflow the frame.
      instances: [{ browser: "chromium", viewport: { width: 1024, height: 768 } }],
    },
  },
});
