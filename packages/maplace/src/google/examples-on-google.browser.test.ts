import { afterAll, expect, it, vi } from "vitest";
import "../element/google";
import { EXAMPLE_PAGES, isPageOnly, onProvider } from "../testing/examples/example-files";
import { openPage } from "../testing/examples/example-page";
import { serveExampleData } from "../testing/examples/example-surroundings";
import { TILES_TIMEOUT_MS } from "./testing/store-on-google";
import { describeWithKey } from "./testing/with-key";

/** A reader's stylesheet gives the map its size; the pages leave that to them. */
const PAGE_STYLE = "maplace-map { display: block; height: 240px; }";

afterAll(() => vi.unstubAllGlobals());

// The page-only examples (quick-start) on real Google Maps. Every other example runs on real
// Google on the built site, each of its versions (the site's `examples-on-google.test.ts`;
// `example-sections.test.ts` holds every one but quick-start to a section), so its pages aren't
// drawn twice, each map billed.
const PAGE_ONLY_PAGES = EXAMPLE_PAGES.filter(onProvider("google")).filter(({ name }) =>
  isPageOnly(name),
);

describeWithKey("the page-only example pages on Google Maps", (key) => {
  const style = document.createElement("style");
  style.textContent = PAGE_STYLE;
  document.head.append(style);
  serveExampleData();

  it.each(PAGE_ONLY_PAGES)(
    "opens the $name page on Google",
    async ({ html }) => {
      const page = openPage(html, { apiKey: key });
      await expect.poll(() => page.map.loadState, { timeout: TILES_TIMEOUT_MS }).toBe("ready");
      expect(page.errors).toEqual([]);
    },
    60_000,
  );
});
