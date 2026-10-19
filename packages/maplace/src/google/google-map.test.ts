// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import type * as Core from "../index";
import type { Maplace } from "../index";
import { createFakeAdapter, type FakeAdapter } from "../testing/fake-adapter";
import { googleMapWith } from "./google-map";
import type { GoogleAdapterOptions } from "./options";

const stores: Maplace[] = [];
vi.mock("../index", async (importOriginal) => {
  const real = await importOriginal<typeof Core>();
  const createMaplace: typeof real.createMaplace = (options) => {
    const store = real.createMaplace(options);
    stores.push(store as Maplace);
    return store;
  };
  return { ...real, createMaplace };
});

const locations = [
  { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
];

/** A Google map made on the fake: the options its adapter was made with, and the adapter. */
function made() {
  const given: GoogleAdapterOptions[] = [];
  const adapters: FakeAdapter[] = [];
  const createAdapter = (options: GoogleAdapterOptions) => {
    given.push(options);
    const adapter = createFakeAdapter();
    adapters.push(adapter);
    return adapter;
  };
  return { given, adapters, createAdapter };
}

function pageWith(...ids: string[]): HTMLElement[] {
  const elements = ids.map((id) => Object.assign(document.createElement("div"), { id }));
  document.body.replaceChildren(...elements);
  return elements;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("googleMapWith", () => {
  it("makes the adapter with the Google options and the store with the rest", () => {
    const [map] = pageWith("map");
    const { given, adapters, createAdapter } = made();
    const mapOptions = { mapTypeControl: true };
    const maplace = googleMapWith(createAdapter, "#map", {
      mapId: "DEMO_MAP_ID",
      colorScheme: "dark",
      mapOptions,
      locations,
      selectedId: "rome",
    });
    expect(given).toEqual([{ mapId: "DEMO_MAP_ID", colorScheme: "dark", mapOptions }]);
    expect(maplace.getSnapshot()).toMatchObject({ selectedId: "rome", loadState: "loading" });
    expect(maplace.getSnapshot().locations.map(({ id }) => id)).toEqual(["rome", "milan"]);
    expect(adapters[0]?.mounted?.container).toBe(map);
  });

  it("puts no list on the map unless asked", () => {
    pageWith("map");
    const { adapters, createAdapter } = made();
    googleMapWith(createAdapter, "#map", { mapId: "id", locations });
    expect(adapters[0]?.callsOf("mountControl")).toEqual([]);
    expect(document.querySelector("[role=listbox]")).toBeNull();
  });

  it("puts the default list on the map, top-right, with list: true", () => {
    const [map] = pageWith("map");
    const { adapters, createAdapter } = made();
    googleMapWith(createAdapter, "#map", { mapId: "id", locations, list: true });
    expect(adapters[0]?.callsOf("mountControl")).toEqual([
      { method: "mountControl", position: "top-right" },
    ]);
    expect(map?.querySelector("[role=listbox]")).not.toBeNull();
  });

  it("puts a list with its options in the corner asked for", () => {
    const [map] = pageWith("map");
    const { adapters, createAdapter } = made();
    const list = { heading: "Choose a location:", position: "bottom-left" } as const;
    googleMapWith(createAdapter, "#map", { mapId: "id", locations, list });
    expect(adapters[0]?.callsOf("mountControl")).toEqual([
      { method: "mountControl", position: "bottom-left" },
    ]);
    expect(map?.textContent).toContain("Choose a location:");
  });

  it("puts the list in the page's element instead, with list.container", () => {
    const [, side] = pageWith("map", "side");
    const { adapters, createAdapter } = made();
    googleMapWith(createAdapter, "#map", { mapId: "id", locations, list: { container: "#side" } });
    expect(adapters[0]?.callsOf("mountControl")).toEqual([]);
    expect(side?.querySelector("[role=listbox]")).not.toBeNull();
  });

  it("takes the map and its list down on destroy", () => {
    const [, side] = pageWith("map", "side");
    const { adapters, createAdapter } = made();
    const list = { as: "select", container: side } as const;
    const maplace = googleMapWith(createAdapter, "#map", { mapId: "id", locations, list });
    expect(side?.querySelector("select")).not.toBeNull();
    maplace.destroy();
    expect(side?.querySelector("select")).toBeNull();
    expect(adapters[0]?.destroyed).toBe(true);
    expect(() => maplace.select("rome")).toThrow(expect.objectContaining({ code: "destroyed" }));
  });

  it("destroys the store and rethrows when attach refuses the container", () => {
    const { adapters, createAdapter } = made();
    expect(() => googleMapWith(createAdapter, "#nope", { mapId: "id", locations })).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        message: 'attach: container "#nope" matches no element',
      }),
    );
    expect(adapters[0]?.mounted).toBeUndefined();
    expect(() => stores.at(-1)?.select("rome")).toThrow(
      expect.objectContaining({ code: "destroyed" }),
    );
  });

  it("destroys the store and rethrows when the adapter refuses its options", () => {
    pageWith("map");
    const refusal = new Error("createGoogleAdapter: options.mapId must be a non-empty string");
    const createAdapter = () => {
      throw refusal;
    };
    expect(() => googleMapWith(createAdapter, "#map", { mapId: "", locations })).toThrow(refusal);
    expect(() => stores.at(-1)?.select("rome")).toThrow(
      expect.objectContaining({ code: "destroyed" }),
    );
  });

  it("refuses the page's own map, left to the long form", () => {
    pageWith("map");
    const { createAdapter } = made();
    const options = { mapId: "id", map: {} } as never;
    expect(() => googleMapWith(createAdapter, "#map", options)).toThrow(
      expect.objectContaining({ code: "invalid-input", field: "options.map" }),
    );
  });

  it("gives 0.2's keys their migration hints", () => {
    pageWith("map");
    const { createAdapter } = made();
    const options = { mapId: "id", map_div: "#map" } as never;
    expect(() => googleMapWith(createAdapter, "#map", options)).toThrow(
      /map_div is a 0.2 option; pass it to createGoogleMap or attach/,
    );
  });
});
