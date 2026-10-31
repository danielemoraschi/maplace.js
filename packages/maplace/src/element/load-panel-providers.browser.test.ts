import { afterEach, describe, expect, it } from "vitest";
import { nextTask } from "../adapter-kit/chunks";
import { MAPS_SCRIPT_ORIGIN } from "../google/maps-script-url";
import { mapsTags } from "../google/testing/maps-tags";
import "./google";
import "./maplibre";
import type { MaplaceMapElement } from "./index";
import { lineIn } from "./testing/load-panel";

// The real providers, on maps held and never released: no key, nothing asked of anyone.

const OPENFREEMAP = "tiles.openfreemap.org";

async function heldOn(attributes: string): Promise<MaplaceMapElement> {
  document.body.innerHTML = `<maplace-map hold ${attributes}></maplace-map>`;
  await nextTask();
  return document.querySelector("maplace-map") as MaplaceMapElement;
}

const requestsTo = (origin: string) =>
  performance.getEntriesByType("resource").filter(({ name }) => name.includes(origin));

afterEach(() => document.body.replaceChildren());

describe("The load panel on the real providers", () => {
  it("says Google on Google, adding no Maps JS, api-key given", async () => {
    const map = await heldOn('provider="google" api-key="not-a-key"');
    expect(lineIn(map)?.textContent).toBe("Loads from Google");
    expect(mapsTags()).toEqual([]);
    expect(requestsTo(MAPS_SCRIPT_ORIGIN)).toEqual([]);
  });

  it("says OpenFreeMap on MapLibre by default, asking OpenFreeMap nothing", async () => {
    const map = await heldOn('provider="maplibre"');
    expect(lineIn(map)?.textContent).toBe("Loads from OpenFreeMap");
    expect(requestsTo(OPENFREEMAP)).toEqual([]);
  });

  it("says the style's host, following map-style while held", async () => {
    const map = await heldOn('provider="maplibre" map-style="https://a.example:8443/style.json"');
    expect(lineIn(map)?.textContent).toBe("Loads from a.example:8443");
    map.setAttribute("map-style", "https://b.example/style.json");
    await nextTask();
    expect(lineIn(map)?.textContent).toBe("Loads from b.example");
    expect(requestsTo("a.example")).toEqual([]);
  });

  it("shows only the button for a JSON style", async () => {
    const map = await heldOn(`provider="maplibre" map-style='{"version":8}'`);
    expect(lineIn(map)?.hidden).toBe(true);
    expect(map.querySelector(".maplace-load-panel>button")?.textContent).toBe("Load map");
  });

  it("goes from a provider's written name to its own as it changes", async () => {
    const map = await heldOn('provider="neither"');
    expect(lineIn(map)?.textContent).toBe("Loads from neither");
    map.setAttribute("provider", "google");
    await nextTask();
    expect(lineIn(map)?.textContent).toBe("Loads from Google");
  });
});
