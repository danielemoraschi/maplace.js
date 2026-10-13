import { beforeAll, describe } from "vitest";
import { MAPS_KEY } from "./maps-key";
import { loadMapsForTests } from "./maps-loader";

/** Tests that need real Google Maps: skipped without a key; Maps JS loads once before them. */
export function describeWithMaps(name: string, body: () => void): void {
  const key = MAPS_KEY;
  if (key === undefined) {
    describe.skip(name, body);
    return;
  }
  describe(name, () => {
    beforeAll(() => loadMapsForTests(key));
    body();
  });
}
