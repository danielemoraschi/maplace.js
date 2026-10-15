import { describe, expect, it } from "vitest";
import type { AdapterHost, MountContext } from "../adapter";
import type { GoogleLibraries } from "./libraries";
import { directMarkers } from "./marker-layer";
import { mountMap } from "./mounted-map";

const host = {} as AdapterHost;
const libraries = {} as GoogleLibraries;

function opened(controller = new AbortController()) {
  const released: string[] = [];
  const context = { host, signal: controller.signal, cluster: true, popup: {} } as MountContext;
  const inUse = { map: {} as google.maps.Map, release: () => released.push("map") };
  return { released, ...mountMap({ inUse, libraries, context, markerLayer: directMarkers }) };
}

describe("mountMap", () => {
  it("gives parts the map and the libraries", () => {
    const { mounted } = opened();
    expect(mounted.libraries).toBe(libraries);
  });

  it("reports to the host until the load is cancelled", () => {
    const controller = new AbortController();
    const { mounted } = opened(controller);
    expect(mounted.live()).toBe(host);
    controller.abort();
    expect(mounted.live()).toBeUndefined();
  });

  it("reports to no one once closed", () => {
    const { mounted, close } = opened();
    close();
    expect(mounted.live()).toBeUndefined();
  });

  it("closes once: the map's release, then parts' teardowns, last added first", () => {
    const { mounted, close, released } = opened();
    mounted.onDestroy(() => released.push("first part"));
    mounted.onDestroy(() => released.push("second part"));
    close();
    close();
    expect(released).toEqual(["map", "second part", "first part"]);
  });
});
