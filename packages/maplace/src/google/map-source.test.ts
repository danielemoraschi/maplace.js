// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { warnOfDemoMapIdOnce } from "./demo-map-id";
import { createdMapOptions, mapSourceFor } from "./map-source";
import type { GoogleAdapterOptions } from "./options";
import { StubMap, stubLibraries } from "./testing/stub-libraries";

vi.mock("./demo-map-id", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./demo-map-id")>()),
  warnOfDemoMapIdOnce: vi.fn(),
}));

const libraries = stubLibraries();

beforeEach(() => vi.mocked(warnOfDemoMapIdOnce).mockClear());

function containerWith(...children: HTMLElement[]) {
  const container = document.createElement("div");
  container.append(...children);
  return container;
}

describe("createdMapOptions", () => {
  it("passes the map ID and the page's map options, starting at the world view", () => {
    const options = createdMapOptions({ mapId: "id", mapOptions: { disableDefaultUI: true } });
    expect(options).toEqual({
      disableDefaultUI: true,
      mapId: "id",
      center: { lat: 0, lng: 0 },
      zoom: 1,
    });
  });

  it.each([
    ["light", "LIGHT"],
    ["dark", "DARK"],
    ["follow-system", "FOLLOW_SYSTEM"],
  ] as const)("gives Google the %s colour scheme as %s", (colorScheme, google) => {
    expect(createdMapOptions({ mapId: "id", colorScheme }).colorScheme).toBe(google);
  });

  it("uses Google's demo map ID when the page gives none", () => {
    expect(createdMapOptions({}).mapId).toBe("DEMO_MAP_ID");
  });

  it("leaves Google's own colour scheme when none is given", () => {
    expect(createdMapOptions({ mapId: "id" })).not.toHaveProperty("colorScheme");
  });
});

describe("a map maplace creates", () => {
  it("opens in its own element filling the container; release removes only that", () => {
    const pageContent = document.createElement("p");
    const container = containerWith(pageContent);
    const { map, release } = mapSourceFor({ mapId: "id" }).open(container, libraries);
    const { element, options } = map as unknown as StubMap;
    expect(element.parentElement).toBe(container);
    expect([element.style.width, element.style.height]).toEqual(["100%", "100%"]);
    expect(options).toMatchObject({ mapId: "id" });
    release();
    expect(Array.from(container.children)).toEqual([pageContent]);
  });

  it("opens in an element panels on the map stay within", () => {
    const { map } = mapSourceFor({ mapId: "id" }).open(containerWith(), libraries);
    expect((map as unknown as StubMap).element.className).toBe("maplace-google-map");
  });

  it("leaves the container as it was when Google refuses the map", () => {
    const refusing = class {
      constructor() {
        throw new Error("bad map options");
      }
    };
    const container = containerWith();
    const open = () =>
      mapSourceFor({ mapId: "id" }).open(container, {
        ...libraries,
        maps: { ...libraries.maps, Map: refusing as never },
      });
    expect(open).toThrow("bad map options");
    expect(container.children).toHaveLength(0);
  });

  it("opens and releases a map Google disabled, listening to nothing", () => {
    // Maps JS 3.66: a map Google disabled has no div, and adding a listener fails.
    const disabled = class extends StubMap {
      override getDiv() {
        return undefined as never;
      }
      override addListener(): never {
        throw new TypeError("Google gave no listener");
      }
    };
    const container = containerWith();
    const { release } = mapSourceFor({ mapId: "id" }).open(container, {
      ...libraries,
      maps: { ...libraries.maps, Map: disabled as never },
    });
    expect(release).not.toThrow();
    expect(container.children).toHaveLength(0);
  });

  it("releases a map Google disabled once open, its listeners gone with it", () => {
    // Maps JS 3.66: a key refused after the map opened leaves it with no div.
    let disabled = false;
    const disabling = class extends StubMap {
      override getDiv() {
        return disabled ? (undefined as never) : super.getDiv();
      }
      override addListener(...args: Parameters<StubMap["addListener"]>) {
        const listener = super.addListener(...args);
        return {
          remove: () => {
            if (disabled) throw new TypeError("Google serves this map no more");
            listener.remove();
          },
        };
      }
    };
    const container = containerWith();
    const { release } = mapSourceFor({ mapId: "id" }).open(container, {
      ...libraries,
      maps: { ...libraries.maps, Map: disabling as never },
    });
    disabled = true;
    expect(release).not.toThrow();
    expect(container.children).toHaveLength(0);
  });
});

describe("the demo map ID's warning", () => {
  it("warns when it opens a map with the demo map ID, not when the page gives one", () => {
    mapSourceFor({ mapId: "id" }).open(containerWith(), libraries);
    expect(warnOfDemoMapIdOnce).not.toHaveBeenCalled();
    mapSourceFor({}).open(containerWith(), libraries);
    expect(warnOfDemoMapIdOnce).toHaveBeenCalledOnce();
  });

  it("says nothing for the page's own map, which keeps its own map ID", () => {
    const element = document.createElement("div");
    const pageMap = { getDiv: () => element } as unknown as google.maps.Map;
    mapSourceFor({ map: pageMap }).open(containerWith(element), libraries);
    expect(warnOfDemoMapIdOnce).not.toHaveBeenCalled();
  });
});

describe("the page's own map", () => {
  it("opens as the page made it, and release leaves it", () => {
    const element = document.createElement("div");
    const pageMap = { getDiv: () => element } as unknown as google.maps.Map;
    const options: GoogleAdapterOptions = { mapId: "id", map: pageMap };
    const container = containerWith(element);
    const { map, release } = mapSourceFor(options).open(container, libraries);
    expect(map).toBe(pageMap);
    expect(element.className).toBe("");
    release();
    expect(element.parentElement).toBe(container);
  });
});
