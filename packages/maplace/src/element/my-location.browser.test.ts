import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { ORIGIN_DOT_CLASS } from "../adapter-kit/origin-dot";
import { createFakeAdapter } from "../testing/fake-adapter";
import { MY_LOCATION_CLASS } from "../views/my-location-nodes";
import { defineProvider } from "./index";

afterEach(() => {
  vi.restoreAllMocks();
});

let providers = 0;

/** A `<maplace-map>` on the fake, sorted, with the control; its map adapters in the order opened. */
async function mapOnFake(attributes: Record<string, string>) {
  const adapters: ReturnType<typeof createFakeAdapter>[] = [];
  const provider = `fake-my-location-${++providers}`;
  defineProvider(provider, () => {
    const adapter = createFakeAdapter();
    void adapter.finishMount();
    adapters.push(adapter);
    return adapter;
  });
  const map = document.createElement("maplace-map");
  map.setAttribute("provider", provider);
  map.setAttribute("list", "");
  map.setAttribute("list-sort", "distance");
  map.style.cssText = "display:block;width:400px;height:300px";
  for (const [name, value] of Object.entries(attributes)) map.setAttribute(name, value);
  for (const [id, lat] of [
    ["far", 50],
    ["near", 2],
  ] as const) {
    const location = document.createElement("maplace-location");
    location.setAttribute("location-id", id);
    location.setAttribute("lat", String(lat));
    location.setAttribute("lng", "0");
    location.setAttribute("title", id);
    map.append(location);
  }
  document.body.append(map);
  onTestFinished(() => map.remove());
  await vi.waitFor(() => {
    if (map.querySelector(`.${MY_LOCATION_CLASS} button`) === null) throw new Error("no control");
  });
  return { map, adapters };
}

const buttonIn = (map: Element) =>
  map.querySelector(`.${MY_LOCATION_CLASS} button`) as HTMLButtonElement;
const firstEntry = (map: Element) => map.querySelector("[role=option]")?.firstChild?.textContent;

describe("the element's My location control", () => {
  it("shows in its corner, and a press sorts a list-sort list", async () => {
    vi.spyOn(navigator.geolocation, "getCurrentPosition").mockImplementation((arrived) =>
      arrived({ coords: { latitude: 0, longitude: 0 } } as GeolocationPosition),
    );
    const { map, adapters } = await mapOnFake({
      "my-location-label": "Near me",
      "my-location-position": "bottom-left",
    });
    const positions = adapters[0]?.callsOf("mountControl").map(({ position }) => position);
    expect(positions).toContain("bottom-left");
    expect(buttonIn(map).textContent).toBe("Near me");
    expect(firstEntry(map)).toBe("far");
    buttonIn(map).click();
    await vi.waitFor(() => expect(firstEntry(map)).toBe("near"));
  });

  it("the map opened again keeps the origin, the dot and the pressed button", async () => {
    vi.spyOn(navigator.geolocation, "getCurrentPosition").mockImplementation((arrived) =>
      arrived({ coords: { latitude: 0, longitude: 0 } } as GeolocationPosition),
    );
    const { map } = await mapOnFake({ "my-location-label": "" });
    buttonIn(map).click();
    await vi.waitFor(() => expect(buttonIn(map).getAttribute("aria-pressed")).toBe("true"));
    const parent = map.parentElement as HTMLElement;
    map.remove();
    await new Promise((resolve) => setTimeout(resolve));
    parent.append(map);
    await vi.waitFor(() => {
      expect(buttonIn(map).getAttribute("aria-pressed")).toBe("true");
      expect(map.querySelector(`.${ORIGIN_DOT_CLASS}`)).not.toBeNull();
    });
  });
});
