import { describe, it } from "vitest";
import { MAPS_KEY } from "./maps-key";
import { loadMapsForTests } from "./maps-loader";

/**
 * Tests that need real Google Maps. Maps JS loads before their checks register (Vitest waits for
 * an async suite), so a subject can build a Google map in `create`. Without a key, one skipped
 * test says why: a skipped suite's body still runs, and would reach for `google`.
 */
export function describeWithMaps(name: string, body: () => void): void {
  const key = MAPS_KEY;
  if (key === undefined) {
    describe.skip(name, () => it("runs with VITE_MAPS_KEY set"));
    return;
  }
  describe(name, async () => {
    await loadMapsForTests(key);
    body();
  });
}
