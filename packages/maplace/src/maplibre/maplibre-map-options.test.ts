import { describe, expect, it } from "vitest";
import { checkMapLibreMapOptions, splitMapLibreMapOptions } from "./maplibre-map-options";

function refusal(field: string, message: string) {
  return expect.objectContaining({ code: "invalid-input", field, message });
}

describe("checkMapLibreMapOptions", () => {
  it("accepts a style, map options and a list", () => {
    const options = { mapStyle: "https://tiles.example/style.json", mapOptions: {}, list: true };
    expect(() => checkMapLibreMapOptions(options)).not.toThrow();
  });

  it("refuses the page's own map, which takes the long form", () => {
    expect(() => checkMapLibreMapOptions({ map: {} })).toThrow(
      refusal(
        "options.map",
        "createMapLibreMap: options.map is for createMapLibreAdapter: attach it to a store of your own",
      ),
    );
  });

  it("tells a style URL given as `style` where it goes", () => {
    expect(() => checkMapLibreMapOptions({ style: "https://tiles.example/style.json" })).toThrow(
      refusal(
        "options.style",
        "createMapLibreMap: options.style is the shapes' default style: the map's style URL is mapStyle",
      ),
    );
  });
});

describe("splitMapLibreMapOptions", () => {
  it("hands the adapter its keys, the store the rest, and keeps the list apart", () => {
    const style = { stroke: "#ff0000" };
    const options = { mapStyle: "s", mapOptions: {}, globe: true, style, list: true } as const;
    const split = splitMapLibreMapOptions(options);
    expect(split).toEqual({
      adapterOptions: { mapStyle: "s", mapOptions: {}, globe: true },
      storeOptions: { style },
      list: true,
    });
  });
});
