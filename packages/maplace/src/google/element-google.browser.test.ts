import { expect, it } from "vitest";
import "../element/google";
import { errorsOn } from "../element/testing/dom";
import { MAPS_SCRIPT_ORIGIN } from "./maps-script-url";
import { MAPS_JS_VERSION } from "./testing/maps-loader";
import { TILES_TIMEOUT_MS } from "./testing/store-on-google";
import { describeWithKey } from "./testing/with-maps";

const LOCATIONS =
  '<maplace-location location-id="rome" lat="41.9028" lng="12.4964" title="Rome"></maplace-location>' +
  '<maplace-location location-id="milan" lat="45.4642" lng="9.19" title="Milan"></maplace-location>';

function mapsScripts(): HTMLScriptElement[] {
  return [...document.querySelectorAll<HTMLScriptElement>(`script[src^="${MAPS_SCRIPT_ORIGIN}"]`)];
}

/** A `<maplace-map>` with these attributes and two locations, on the page. */
function mapWith(attributes: string): HTMLElementTagNameMap["maplace-map"] {
  document.body.insertAdjacentHTML(
    "beforeend",
    `<maplace-map style="display: block; height: 240px" ${attributes}>${LOCATIONS}</maplace-map>`,
  );
  return document.body.lastElementChild as HTMLElementTagNameMap["maplace-map"];
}

const ready = (map: HTMLElementTagNameMap["maplace-map"]) =>
  expect.poll(() => map.loadState, { timeout: TILES_TIMEOUT_MS }).toBe("ready");

// One page, in order: the first map's Maps JS is the page's for every later one.
describeWithKey("<maplace-map> loading Google Maps itself", (key) => {
  const settings = `api-key="${key}" map-id="DEMO_MAP_ID" version="${MAPS_JS_VERSION}"`;

  it("adds no Maps JS while held, then once released, with the page's nonce, and opens", async () => {
    const map = mapWith(`${settings} nonce="n0" hold`);
    await new Promise((resolve) => setTimeout(resolve));
    expect([mapsScripts(), map.loadState]).toEqual([[], "idle"]);
    map.release();
    expect(mapsScripts().map(({ nonce }) => nonce)).toEqual(["n0"]);
    await ready(map);
  });

  it("shares the page's Maps JS with a second map, which needs no key", async () => {
    const map = mapWith(`map-id="DEMO_MAP_ID"`);
    await ready(map);
    expect(mapsScripts()).toHaveLength(1);
  });

  it("refuses a map asking for another language than the page loaded", async () => {
    const map = mapWith(`${settings} language="en"`);
    const errors = errorsOn(map);
    await expect.poll(() => map.loadState).toBe("error");
    expect(errors.map(({ field }) => field)).toEqual(["language"]);
    expect(mapsScripts()).toHaveLength(1);
  });

  it("draws the README's page: a key, a map ID, a list and its locations", async () => {
    const map = mapWith(`api-key="${key}" map-id="DEMO_MAP_ID" list`);
    await ready(map);
    const list = map.querySelector('[role="listbox"]');
    expect(list?.textContent).toContain("Rome");
    expect(list?.textContent).toContain("Milan");
    await expect.poll(() => map.querySelectorAll("gmp-advanced-marker").length).toBe(2);
  });
});
