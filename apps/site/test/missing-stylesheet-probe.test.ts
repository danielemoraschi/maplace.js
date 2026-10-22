// @vitest-environment happy-dom
import type { Map as MapLibreMap } from "maplibre-gl";
import { describe, expect, it, vi } from "vitest";
import { warnOfMissingStylesheetOnce } from "../../../packages/maplace/src/maplibre/stylesheet-check.ts";
import { MISSING_STYLESHEET } from "./drawn-on-maplibre.ts";

// The MapLibre e2e checks that no warning matches `MISSING_STYLESHEET`: were the package to reword
// its warning, that check would match nothing and pass. This holds the probe to the warning.
describe("MISSING_STYLESHEET", () => {
  it("matches the warning maplace gives on a page without MapLibre's stylesheet", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const container = document.createElement("div");
    document.body.append(container);
    warnOfMissingStylesheetOnce({ getContainer: () => container } as unknown as MapLibreMap);
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0]?.[0])).toContain(MISSING_STYLESHEET);
  });
});
