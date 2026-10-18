import { expect, it, onTestFinished } from "vitest";
import "../element/google";
import { defineListView, type ListViewSetup } from "../element";
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

  it("puts a list view of the page's own on the map, with its heading", async () => {
    const given: ListViewSetup[] = [];
    defineListView("plain-checks", (_, setup) => {
      given.push(setup);
      const element = document.createElement("fieldset");
      for (const { id } of setup.listed()) {
        element.append(
          Object.assign(document.createElement("input"), { type: "checkbox", value: id }),
        );
      }
      return { element, destroy: () => element.remove() };
    });
    const map = mapWith(
      `${settings} list="plain-checks" list-position="top-left" list-heading="Choose a location:"`,
    );
    // Google puts controls on a map only once it is in view; the file's earlier maps push this one below.
    map.scrollIntoView();
    onTestFinished(() => map.remove());
    await ready(map);
    const pane = map.querySelector(".maplace-map-pane");
    await expect
      .poll(() => pane?.querySelector("fieldset"), { timeout: TILES_TIMEOUT_MS })
      .not.toBeNull();
    expect(pane?.querySelectorAll("fieldset input")).toHaveLength(2);
    expect(given.map(({ options }) => options.heading)).toEqual(["Choose a location:"]);
  });
});
