import { describe, it } from "vitest";
import { MAPS_KEY } from "./maps-key";
import { loadMapsForTests } from "./maps-loader";

/** A key Google refuses (`InvalidKeyMapError`), for the tests of what a page then sees. */
const REFUSED_KEY = "maplace-refused-key";

/**
 * Tests that need real Google Maps. Maps JS loads before their checks register (Vitest waits for
 * an async suite), so a subject can build a Google map in `create`. Without a key, one skipped
 * test says why: a skipped suite's body still runs, and would reach for `google`.
 */
export function describeWithMaps(name: string, body: () => void): void {
  describeLoaded(name, MAPS_KEY, body);
}

/**
 * Tests on Maps JS loaded with a key Google refuses. Each browser test file has a page of its
 * own, so the refusal stays in it. Run only where the Maps tests run.
 */
export function describeWithRefusedKey(name: string, body: () => void): void {
  describeLoaded(name, MAPS_KEY && REFUSED_KEY, body);
}

/**
 * Tests that load Maps JS themselves, as the element's Google provider does: the key, with no
 * Maps JS on the page yet.
 */
export function describeWithKey(name: string, body: (key: string) => void): void {
  describeKeyed(name, MAPS_KEY, body);
}

function describeLoaded(name: string, key: string | undefined, body: () => void): void {
  describeKeyed(name, key, async (loadedKey) => {
    await loadMapsForTests(loadedKey);
    body();
  });
}

/** Without a key, one skipped test says why: a skipped suite's body still runs. */
function describeKeyed(
  name: string,
  key: string | undefined,
  body: (key: string) => void | Promise<void>,
): void {
  if (key === undefined) {
    describe.skip(name, () => it("runs with VITE_MAPS_KEY set"));
    return;
  }
  describe(name, () => body(key));
}
