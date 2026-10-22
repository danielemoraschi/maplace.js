import { afterEach, describe, expect, it } from "vitest";
import { nextTask } from "../adapter-kit/chunks";
import "../maplibre/testing/stylesheet";
import { TEST_STYLE } from "../maplibre/testing/test-style";
import "./maplibre";
import { errorsOn } from "./testing/dom";

// Its own file: it registers only `maplibre`, so a map without `provider` opens on MapLibre.
// Every map here draws the local test style, so nothing leaves the machine; a failure for want of
// WebGL reads plainly in maplibre/webgl.browser.test.ts first.

const STYLE = JSON.stringify(TEST_STYLE);
const OTHER_STYLE = JSON.stringify({
  ...TEST_STYLE,
  layers: [{ id: "background", type: "background", paint: { "background-color": "#f4eee8" } }],
});

const LOCATIONS =
  '<maplace-location location-id="rome" lat="41.9" lng="12.5" title="Rome"></maplace-location>' +
  '<maplace-location location-id="milan" lat="45.46" lng="9.19" title="Milan"></maplace-location>';

afterEach(() => document.body.replaceChildren());

/** A MapLibre map with these attributes, returned before it opens, so listeners see its errors. */
function mapWith(attributes: string): HTMLElementTagNameMap["maplace-map"] {
  // Sized in the body: the head holds MapLibre's stylesheet.
  document.body.innerHTML =
    "<style>maplace-map { width: 600px; height: 300px; }</style>" +
    `<maplace-map ${attributes}>${LOCATIONS}</maplace-map>`;
  const map = document.querySelector("maplace-map");
  if (map === null) throw new Error("no map");
  return map;
}

const styled = (style = STYLE) => `map-style='${style}'`;

const LOAD = { timeout: 15_000 };

describe("<maplace-map> on MapLibre", () => {
  it("opens a MapLibre map in its pane, maplibre being the only provider registered", async () => {
    const map = mapWith(styled());
    await map.maplace.whenReady();
    expect(map.loadState).toBe("ready");
    expect(map.querySelector(".maplace-map-pane .maplibregl-canvas")).not.toBeNull();
  });

  it("fails the load with provider-load-failed when map-style names a style the server doesn't have", async () => {
    const map = mapWith(`map-style="${location.origin}/maplibre-test-missing/style.json"`);
    const errors = errorsOn(map);
    await expect.poll(() => map.loadState, LOAD).toBe("error");
    expect(errors).toEqual([expect.objectContaining({ code: "provider-load-failed" })]);
  });

  it("applies map-options to the map it creates", async () => {
    const map = mapWith(`${styled()} map-options='{"maxZoom":2}'`);
    await map.maplace.whenReady();
    map.maplace.setView({ lat: 41.9, lng: 12.5 }, 12);
    await expect.poll(() => map.maplace.getSnapshot().viewport?.zoom, LOAD).toBeLessThanOrEqual(3);
  });

  it("opens the map again where it was when map-style changes, keeping the selection", async () => {
    const map = mapWith(styled());
    await map.maplace.whenReady();
    map.maplace.select("milan");
    const center = () => map.maplace.getSnapshot().viewport?.center;
    await expect
      .poll(center, LOAD)
      .toEqual({ lat: expect.closeTo(45.46, 1), lng: expect.closeTo(9.19, 1) });
    const kept = center();
    const first = map.querySelector(".maplibregl-map");
    map.setAttribute("map-style", OTHER_STYLE);
    await expect.poll(() => map.querySelector(".maplibregl-map") !== first, LOAD).toBe(true);
    await map.maplace.whenReady();
    expect(first?.isConnected).toBe(false);
    expect(map.maplace.getSnapshot().selectedId).toBe("milan");
    await expect.poll(center, LOAD).toEqual({
      lat: expect.closeTo(kept?.lat ?? 90, 2),
      lng: expect.closeTo(kept?.lng ?? 180, 2),
    });
  });

  it("reports bad map-options as misuse naming map-options.center, and opens once corrected", async () => {
    const map = mapWith(`${styled()} map-options='{"center":[0,0]}'`);
    const errors = errorsOn(map);
    await nextTask();
    expect(errors).toEqual([
      expect.objectContaining({ code: "invalid-input", field: "map-options.center" }),
    ]);
    expect(map.loadState).toBe("error");
    map.setAttribute("map-options", '{"maxZoom":18}');
    await expect.poll(() => map.loadState, LOAD).toBe("ready");
    expect(map.querySelector(".maplibregl-canvas")).not.toBeNull();
  });
});
