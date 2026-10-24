import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";
import { defaultClientConditions } from "vite";
import { exampleFailureNotes } from "./src/site/example-failure-notes.ts";
import { exampleMapId } from "./src/site/example-map-id.ts";
import { exampleModulesRun } from "./src/site/example-modules-run.ts";
import { mapsSettingsCheck } from "./src/site/maps-settings-check.ts";
import { PREBUNDLED_DEPS } from "./src/site/prebundled-deps.ts";

export default defineConfig({
  site: "https://maplacejs.com",
  output: "static",
  integrations: [mapsSettingsCheck()],
  trailingSlash: "always",
  env: {
    schema: {
      // The site's Google Maps key: public by nature (referrer-restricted, W6), so it is written
      // into the pages. Without it, a map asked to load reports its missing key.
      SITE_MAPS_KEY: envField.string({ context: "server", access: "public", optional: true }),
      // The site's own Google map ID (W6), public as any map ID; on the client too, where the
      // examples' vanilla and React versions read it. Without it, the maps run on Google's
      // DEMO_MAP_ID and warn of it.
      SITE_MAPS_MAP_ID: envField.string({ context: "client", access: "public", optional: true }),
    },
  },
  markdown: { shikiConfig: { theme: "css-variables" } },
  // maplace resolved to its source, as the tests and the examples' type-check do.
  vite: {
    plugins: [tailwindcss(), exampleModulesRun(), exampleMapId(), exampleFailureNotes()],
    resolve: { conditions: ["maplace:source", ...defaultClientConditions] },
    optimizeDeps: { include: [...PREBUNDLED_DEPS] },
  },
});
