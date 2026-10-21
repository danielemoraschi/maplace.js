import { describe, it } from "vitest";
import { MAPS_KEY } from "./maps-key";

/**
 * Tests that load Maps JS themselves, as the element's Google provider does, or build a site that
 * does: the key, with no Maps JS on the page yet. Free of Google's types, so the site's tests
 * share it.
 */
export function describeWithKey(name: string, body: (key: string) => void): void {
  describeKeyed(name, MAPS_KEY, body);
}

/** Without a key, one skipped test says why: a skipped suite's body still runs. */
export function describeKeyed(
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
