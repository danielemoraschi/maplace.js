import { defineConfig, envField } from "astro/config";
import { defaultClientConditions } from "vite";
import { exampleModulesRun } from "./src/site/example-modules-run.ts";
import { mapsKeyCheck } from "./src/site/maps-key-check.ts";

export default defineConfig({
  site: "https://maplacejs.com",
  output: "static",
  integrations: [mapsKeyCheck()],
  trailingSlash: "always",
  env: {
    schema: {
      // The site's Google Maps key: public by nature (referrer-restricted, W6), so it is written
      // into the pages. Without it, a map asked to load reports its missing key.
      SITE_MAPS_KEY: envField.string({ context: "server", access: "public", optional: true }),
    },
  },
  markdown: { shikiConfig: { theme: "css-variables" } },
  // maplace resolved to its source, as the tests and the examples' type-check do.
  vite: {
    plugins: [exampleModulesRun()],
    resolve: { conditions: ["maplace:source", ...defaultClientConditions] },
    // The Google adapter imports the clusterer on demand, and a React version React when it
    // starts: found that late, the dev server re-optimizes and refuses the import it had already
    // handed out (`big` failed to cluster).
    optimizeDeps: {
      include: [
        "@googlemaps/markerclusterer",
        "react",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom/client",
      ],
    },
  },
});
