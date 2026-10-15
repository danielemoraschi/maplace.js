// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMaplace } from "../maplace/create";
import { wait } from "./testing/map-waits";
import { sizeable } from "./testing/sized-element";
import { attachedToGoogle } from "./testing/store-on-google";
import { StubMap, stubMapsJs } from "./testing/stub-libraries";
import { stubRoutes } from "./testing/stub-routes";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Maps JS whose maps start shown and uninitialised, as Google first gives them. */
function uninitialisedMaps(): StubMap[] {
  const created: StubMap[] = [];
  stubMapsJs().maps.Map = class extends StubMap {
    constructor(element: HTMLElement) {
      super(element);
      sizeable(element, 512, 512);
      this.renderingType = "UNINITIALIZED";
      created.push(this);
    }
  } as unknown as typeof google.maps.Map;
  return created;
}

describe("the assembled Google adapter", () => {
  it("is ready on a map it creates only once Google has initialised it, as on the page's own", async () => {
    const created = uninitialisedMaps();
    let ready = false;
    const { outcome } = attachedToGoogle(createMaplace());
    void outcome.then(() => (ready = true));
    await vi.waitFor(() => expect(created).toHaveLength(1));
    await wait(0);
    expect(ready).toBe(false);
    created[0]?.initialise({ isAdvancedMarkersAvailable: true });
    expect(await outcome).toBe("ready");
  });

  it("draws routes of up to 27 stops, the store's route reaching Google", async () => {
    const routes = stubRoutes();
    stubMapsJs(undefined, { routes: routes.library });
    const locations = [
      { id: "a", lat: 44.5, lng: 11.3 },
      { id: "b", lat: 44.8, lng: 11.6 },
    ];
    const { maplace, adapter, outcome } = attachedToGoogle(createMaplace({ locations }));
    expect(adapter.capabilities.has("route")).toBe(true);
    expect(adapter.routeStopLimit).toBe(27);
    await outcome;
    maplace.setRoute({ stops: ["a", "b"] });
    await vi.waitFor(() => expect(routes.computeRoutes).toHaveBeenCalledOnce());
  });
});
