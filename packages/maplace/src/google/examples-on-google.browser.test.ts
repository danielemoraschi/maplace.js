import { afterAll, expect, it, vi } from "vitest";
import "../element/google";
import { EXAMPLE_PAGES } from "../testing/examples/example-files";
import { openPage } from "../testing/examples/example-page";
import { serveExampleData } from "../testing/examples/example-surroundings";
import { TILES_TIMEOUT_MS } from "./testing/store-on-google";
import { describeWithKey } from "./testing/with-maps";

/** A reader's stylesheet gives the map its size; the pages leave that to them. */
const PAGE_STYLE = "maplace-map { display: block; height: 240px; }";

afterAll(() => vi.unstubAllGlobals());

// The example pages on real Google Maps, one after another in one document: the first page's
// Maps JS is the page's for every later one, as on a site.
describeWithKey("the example pages on Google Maps", (key) => {
  const style = document.createElement("style");
  style.textContent = PAGE_STYLE;
  document.head.append(style);
  serveExampleData();

  it.each(EXAMPLE_PAGES)(
    "opens the $name page on Google",
    async ({ html }) => {
      const page = openPage(html, { apiKey: key });
      await expect.poll(() => page.map.loadState, { timeout: TILES_TIMEOUT_MS }).toBe("ready");
      expect(page.errors).toEqual([]);
    },
    60_000,
  );
});
