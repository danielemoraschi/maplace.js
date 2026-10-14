// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createdMapOptions, mapSourceFor } from "./map-source";
import type { GoogleAdapterOptions } from "./options";
import { type StubMap, stubLibraries } from "./testing/stub-libraries";

const libraries = stubLibraries();

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
});

describe("the page's own map", () => {
  it("opens as the page made it, and release leaves it", () => {
    const element = document.createElement("div");
    const pageMap = { getDiv: () => element } as unknown as google.maps.Map;
    const options: GoogleAdapterOptions = { mapId: "id", map: pageMap };
    const container = containerWith(element);
    const { map, release } = mapSourceFor(options).open(container, libraries);
    expect(map).toBe(pageMap);
    release();
    expect(element.parentElement).toBe(container);
  });
});
