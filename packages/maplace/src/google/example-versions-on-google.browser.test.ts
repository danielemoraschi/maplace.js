import { afterAll, expect, it, vi } from "vitest";
import type * as Core from "../index";
import { onProvider, REACT_HOSTS, VANILLA_HOSTS } from "../testing/examples/example-files";
import { openHost } from "../testing/examples/example-hosts";
import { serveExampleData } from "../testing/examples/example-surroundings";
import { recordErrors } from "../testing/examples/page-errors";
import {
  recordedStoreCount,
  recordingCreateMaplace,
  storeAttachedSince,
} from "../testing/examples/recorded-stores";
import { canImportLibraries } from "./libraries";
import { TILES_TIMEOUT_MS } from "./testing/store-on-google";
import { describeWithKey } from "./testing/with-key";

vi.mock("maplace", async (importOriginal) => {
  const real = await importOriginal<typeof Core>();
  return { ...real, createMaplace: recordingCreateMaplace(real.createMaplace) };
});

afterAll(() => vi.unstubAllGlobals());

// The vanilla and React versions on real Google Maps, one after another in one document: the
// first host's bootstrap loads Maps JS, and every later one uses the page's, as on a site.
describeWithKey("the example versions on Google Maps", (key) => {
  serveExampleData();

  it.each([...VANILLA_HOSTS, ...REACT_HOSTS].filter(onProvider("google")))(
    "draws the $example $kind version on Google",
    async ({ html, run }) => {
      openHost(html, { apiKey: canImportLibraries() ? undefined : key });
      const errors = recordErrors();
      const stores = recordedStoreCount();
      await run();
      const store = await vi.waitFor(() => storeAttachedSince(stores));
      await expect
        .poll(() => store.getSnapshot().loadState, { timeout: TILES_TIMEOUT_MS })
        .toBe("ready");
      expect(errors).toEqual([]);
    },
    60_000,
  );
});
