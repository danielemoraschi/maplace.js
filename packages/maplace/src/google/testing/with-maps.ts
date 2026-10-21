import { MAPS_KEY } from "./maps-key";
import { loadMapsForTests } from "./maps-loader";
import { describeKeyed } from "./with-key";

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

function describeLoaded(name: string, key: string | undefined, body: () => void): void {
  describeKeyed(name, key, async (loadedKey) => {
    await loadMapsForTests(loadedKey);
    body();
  });
}
