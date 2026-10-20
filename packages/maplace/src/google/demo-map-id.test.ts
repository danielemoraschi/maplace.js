import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** The module afresh: its warning is once per page, so each test gets a page of its own. */
const freshModule = () => import("./demo-map-id");

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.resetModules();
  warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());

describe("warnOfDemoMapIdOnce", () => {
  it("warns once, however many maps use the demo map ID", async () => {
    const { warnOfDemoMapIdOnce } = await freshModule();
    warnOfDemoMapIdOnce();
    warnOfDemoMapIdOnce();
    expect(warn).toHaveBeenCalledOnce();
  });

  it("names DEMO_MAP_ID, production and the fix in its warning", async () => {
    const { warnOfDemoMapIdOnce } = await freshModule();
    warnOfDemoMapIdOnce();
    const warning = String(warn.mock.calls[0]?.[0]);
    for (const word of ["DEMO_MAP_ID", "development only", "map-id (mapId)", "production"]) {
      expect(warning).toContain(word);
    }
  });
});
