import { describe, expect, it } from "vitest";
import { checkGoogleMapOptions, splitGoogleMapOptions } from "./google-map-options";

function refusal(field: string, message: string) {
  return expect.objectContaining({ code: "invalid-input", field, message });
}

describe("checkGoogleMapOptions", () => {
  it("accepts a map ID alone, or with a list on the map or in the page", () => {
    expect(() => checkGoogleMapOptions({ mapId: "id" })).not.toThrow();
    expect(() => checkGoogleMapOptions({ mapId: "id", list: true })).not.toThrow();
    const corner = { heading: "Cities", position: "bottom-left" };
    expect(() => checkGoogleMapOptions({ mapId: "id", list: corner })).not.toThrow();
    expect(() =>
      checkGoogleMapOptions({ mapId: "id", list: { container: "#side" } }),
    ).not.toThrow();
  });

  it("accepts no map ID: the adapter falls back to Google's demo one", () => {
    expect(() => checkGoogleMapOptions({ locations: [] })).not.toThrow();
  });

  it("refuses options that aren't an object", () => {
    expect(() => checkGoogleMapOptions("#map")).toThrow(
      'createGoogleMap: options must be an object, got "#map"',
    );
  });

  it("refuses a list that is neither true nor its options", () => {
    expect(() => checkGoogleMapOptions({ mapId: "id", list: "select" })).toThrow(
      refusal(
        "options.list",
        'createGoogleMap: options.list must be true or an object, got "select"',
      ),
    );
  });

  it("refuses a corner that isn't one", () => {
    expect(() => checkGoogleMapOptions({ mapId: "id", list: { position: "top" } })).toThrow(
      refusal(
        "options.list.position",
        'createGoogleMap: options.list.position must be one of "top-left", "top-right", "bottom-left", "bottom-right", got "top"',
      ),
    );
  });

  it("refuses a list both on the map and in the page", () => {
    const list = { position: "top-left", container: "#side" };
    expect(() => checkGoogleMapOptions({ mapId: "id", list })).toThrow(
      refusal(
        "options.list.container",
        "createGoogleMap: options.list.container is for a list in the page: leave out position",
      ),
    );
  });

  it("refuses the page's own map, which takes the long form", () => {
    expect(() => checkGoogleMapOptions({ mapId: "id", map: {} })).toThrow(
      refusal(
        "options.map",
        "createGoogleMap: options.map is for createGoogleAdapter: attach it to a store of your own",
      ),
    );
  });

  it("refuses map given as undefined too, as the store refuses an unknown key", () => {
    expect(() => checkGoogleMapOptions({ mapId: "id", map: undefined })).toThrow(
      refusal(
        "options.map",
        "createGoogleMap: options.map is for createGoogleAdapter: attach it to a store of your own",
      ),
    );
  });
});

describe("splitGoogleMapOptions", () => {
  it("leaves the words of what a map adds to the store", () => {
    const split = splitGoogleMapOptions({ skipMapLabel: "Oltre", selectedLabel: "Scelto" });
    expect(split.storeOptions).toEqual({ skipMapLabel: "Oltre", selectedLabel: "Scelto" });
  });

  it("hands the adapter its three keys, the store the rest, and keeps the list apart", () => {
    const list = { heading: "Cities" };
    const split = splitGoogleMapOptions({
      mapId: "id",
      colorScheme: "dark",
      mapOptions: { mapTypeControl: true },
      selectedId: "rome",
      cluster: true,
      list,
    });
    expect(split).toEqual({
      adapterOptions: { mapId: "id", colorScheme: "dark", mapOptions: { mapTypeControl: true } },
      storeOptions: { selectedId: "rome", cluster: true },
      list,
    });
    expect(splitGoogleMapOptions({ mapId: "id", list: true }).list).toBe(true);
  });
});
