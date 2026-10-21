import type { StyleSpecification } from "maplibre-gl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { unmountAll } from "../testing/conformance/harness";
import { warnOfMissingStylesheetOnce } from "./stylesheet-check";
import { mountingMapLibre } from "./testing/mounted";
import { removePageMaps } from "./testing/subject";
import { TEST_STYLE } from "./testing/test-style";

afterEach(() => {
  unmountAll();
  removePageMaps();
  vi.restoreAllMocks();
});

/** A URL on the test server that answers 404. */
const missing = (name: string) => `${location.origin}/maplibre-test-missing/${name}`;

describe("loading MapLibre's style", () => {
  it("fails the load with provider-load-failed when the style isn't found", async () => {
    const { mounting } = mountingMapLibre({ mapStyle: missing("style.json") });
    await expect(mounting).rejects.toMatchObject({
      code: "provider-load-failed",
      message: "mount: the map style failed to load",
    });
  });

  it("loads with a sprite or tiles that aren't found, still logging them", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const style: StyleSpecification = {
      ...TEST_STYLE,
      sprite: missing("sprite"),
      sources: { tiles: { type: "raster", tiles: [missing("{z}/{x}/{y}.png")], tileSize: 256 } },
      layers: [...TEST_STYLE.layers, { id: "tiles", type: "raster", source: "tiles" }],
    };
    const { mounting, host } = mountingMapLibre({ mapStyle: style });
    await expect(mounting).resolves.toBeUndefined();
    // The requests fail in their own time, later under a busy run.
    await vi.waitFor(() => expect(logged).toHaveBeenCalled(), { timeout: 10_000 });
    expect(host.reportsOf("reportError")).toEqual([]);
  });
});

describe("warnOfMissingStylesheetOnce", () => {
  /** A map's container in a document with no stylesheet: a frame's. */
  function containerWithoutStylesheet(): HTMLElement {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameDocument = frame.contentDocument;
    if (frameDocument === null) throw new Error("the frame has no document");
    const container = frameDocument.createElement("div");
    frameDocument.body.append(container);
    return container;
  }

  it("warns once per document, and not where MapLibre's stylesheet is", () => {
    const warned = vi.spyOn(console, "warn").mockImplementation(() => {});
    const withSheet = document.createElement("div");
    document.body.append(withSheet);
    warnOfMissingStylesheetOnce({ getContainer: () => withSheet } as never);
    expect(warned).not.toHaveBeenCalled();
    const without = containerWithoutStylesheet();
    warnOfMissingStylesheetOnce({ getContainer: () => without } as never);
    warnOfMissingStylesheetOnce({ getContainer: () => without } as never);
    expect(warned).toHaveBeenCalledOnce();
    expect(warned.mock.calls[0]?.[0]).toContain('import "maplibre-gl/dist/maplibre-gl.css"');
  });
});
