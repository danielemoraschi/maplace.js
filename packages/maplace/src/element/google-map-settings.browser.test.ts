import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTask } from "../adapter-kit/chunks";
import type { StubMap, StubMarker } from "../google/testing/stub-libraries";
import { stubMapsJsRecording } from "../google/testing/stub-libraries";
import "./google";
import { errorsOn } from "./testing/dom";

// Its own file: it registers only `google`, so a map without `provider` opens on Google, whose
// Maps JS here is stubbed as if the page had loaded it.

const ROME =
  '<maplace-location location-id="rome" lat="41.9" lng="12.5" title="Rome"></maplace-location>';

let created: StubMap[] = [];
let markers: StubMarker[] = [];

beforeEach(() => {
  ({ maps: created, markers } = stubMapsJsRecording());
});

const markersOn = (googleMap: StubMap | undefined) =>
  markers.filter((marker) => marker.map === googleMap && googleMap !== undefined).length;

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

/** A Google map with these attributes, returned before it opens, so listeners see its errors. */
function mapWith(attributes: string): HTMLElementTagNameMap["maplace-map"] {
  document.body.innerHTML = `<maplace-map map-id="m" ${attributes}>${ROME}</maplace-map>`;
  const map = document.querySelector("maplace-map");
  if (map === null) throw new Error("no map");
  return map;
}

describe("the map settings of a Google <maplace-map>", () => {
  it("creates the map with the colour scheme and Google's map options the attributes give", async () => {
    mapWith(`color-scheme="dark" map-options='{"mapTypeControl":true}'`);
    await expect.poll(() => created.length).toBe(1);
    expect(created[0]?.options).toMatchObject({
      mapId: "m",
      colorScheme: "DARK",
      mapTypeControl: true,
    });
  });

  it("reports a bad color-scheme as misuse naming it, and opens the map once corrected", async () => {
    const map = mapWith(`color-scheme="night"`);
    const errors = errorsOn(map);
    await nextTask();
    expect(errors).toEqual([
      expect.objectContaining({ code: "invalid-input", field: "color-scheme" }),
    ]);
    expect([map.loadState, created.length]).toEqual(["error", 0]);
    map.setAttribute("color-scheme", "light");
    await expect.poll(() => created.length).toBe(1);
    expect(created[0]?.options).toMatchObject({ colorScheme: "LIGHT" });
    expect(map.loadState).not.toBe("error");
  });

  it("refuses a map option maplace sets itself, naming the attribute to use", async () => {
    const map = mapWith(`map-options='{"colorScheme":"dark"}'`);
    const errors = errorsOn(map);
    await nextTask();
    expect(errors).toEqual([
      expect.objectContaining({
        code: "invalid-input",
        field: "map-options.colorScheme",
        message: expect.stringContaining("is its own attribute: color-scheme"),
      }),
    ]);
    expect(created).toHaveLength(0);
  });

  it("creates the map again with the new settings when they change", async () => {
    const map = mapWith(`color-scheme="dark"`);
    await expect.poll(() => created.length).toBe(1);
    map.setAttribute("color-scheme", "light");
    map.setAttribute("map-options", '{"mapTypeControl":false}');
    await expect.poll(() => created.length).toBe(2);
    expect(created[1]?.options).toMatchObject({ colorScheme: "LIGHT", mapTypeControl: false });
    expect(created[0]?.element.isConnected).toBe(false);
  });

  it("draws markers on the reopened map, and on a map the page opens afterwards", async () => {
    const first = mapWith(`color-scheme="light"`);
    await expect.poll(() => markersOn(created[0])).toBe(1);
    first.setAttribute("color-scheme", "dark");
    await expect.poll(() => markersOn(created[1])).toBe(1);
    document.body.insertAdjacentHTML("beforeend", `<maplace-map map-id="m">${ROME}</maplace-map>`);
    await expect.poll(() => markersOn(created[2])).toBe(1);
  });

  it("closes the map on a bad new value, standing in error until it's corrected", async () => {
    const map = mapWith("");
    const errors = errorsOn(map);
    await expect.poll(() => created.length).toBe(1);
    map.setAttribute("map-options", '{"zoom":3}');
    await expect.poll(() => errors.map(({ field }) => field)).toEqual(["map-options.zoom"]);
    expect(map.loadState).toBe("error");
    expect(created[0]?.element.isConnected).toBe(false);
    map.setAttribute("map-options", "{}");
    await expect.poll(() => created.length).toBe(2);
    expect(map.loadState).not.toBe("error");
  });
});
