import { describe, expect, it } from "vitest";
import { fromLegacyConfig, type MapAttributes } from "./builder-legacy-config.ts";
import { Refused } from "./builder-literal.ts";
import { createReport } from "./builder-report.ts";

const A = { lat: 1, lon: 2, title: "a" };
const B = { lat: 3, lon: 4, title: "b" };
const C = { lat: 5, lon: 6, title: "c" };

function convert(options: Record<string, unknown>, locations: unknown[] = [A, B]) {
  const report = createReport();
  const result = fromLegacyConfig({ locations, ...options }, report);
  return { ...result, names: report.notes().map(({ name }) => name), notes: report.notes() };
}
const attributes = (options: Record<string, unknown>, locations?: unknown[]): MapAttributes =>
  convert(options, locations).attributes;
const attribute = (options: Record<string, unknown>, name: string) =>
  attributes(options).find(([key]) => key === name)?.[1];

describe("fromLegacyConfig's list", () => {
  it("writes 0.2's defaults", () => {
    expect(attributes({})).toEqual([
      ["list", "select"],
      ["list-position", "top-right"],
      ["fit-all", ""],
      ["fit-all-label", "View All"],
    ]);
  });

  it("follows each list option alone", () => {
    expect(attribute({ controls_type: "list" }, "list")).toBe("");
    expect(attribute({ controls_on_map: false }, "list-position")).toBeUndefined();
    expect(attribute({ view_all: false }, "fit-all")).toBeUndefined();
    expect(attribute({ view_all: false }, "fit-all-label")).toBeUndefined();
    expect(attribute({ view_all_text: "All" }, "fit-all-label")).toBe("All");
    expect(attribute({ controls_title: "Places" }, "list-heading")).toBe("Places");
  });

  it("gives one location no list unless forced, and force beats generate_controls: false", () => {
    expect(attributes({}, [A])).toEqual([]);
    expect(attribute({ generate_controls: false }, "list")).toBeUndefined();
    expect(attributes({ force_generate_controls: true }, [A])[0]).toEqual(["list", "select"]);
    expect(attribute({ generate_controls: false, force_generate_controls: true }, "list")).toBe(
      "select",
    );
  });

  it("offers fit-all only for more than one location, as 0.2's menu did", () => {
    expect(attributes({ force_generate_controls: true }, [A])).toEqual([
      ["list", "select"],
      ["list-position", "top-right"],
    ]);
    expect(attribute({ force_generate_controls: true }, "fit-all")).toBe("");
  });

  it("notes a blank label or heading and never writes one", () => {
    const blank = convert({ view_all_text: "  ", controls_title: 5 });
    expect(blank.names).toEqual(["controls_title", "view_all_text"]);
    expect(blank.attributes).toContainEqual(["fit-all-label", "View All"]);
    expect(blank.attributes.map(([name]) => name)).not.toContain("list-heading");
  });
});

describe("fromLegacyConfig's start", () => {
  it("selects no location start names if it is hidden, which the store would refuse", () => {
    expect(attributes({ show_markers: false, start: 1 }).map(([name]) => name)).not.toContain(
      "selected-id",
    );
  });

  it("gives the id at that position, and 0 or out of range none", () => {
    expect(attribute({ start: 2 }, "selected-id")).toBe("2");
    expect(attribute({ start: 0 }, "selected-id")).toBeUndefined();
    expect(attribute({ start: 9 }, "selected-id")).toBeUndefined();
  });
});

describe("fromLegacyConfig's locations", () => {
  it("spreads shared and commons under each, a location's own winning", () => {
    const { locations } = convert({ shared: { zoom: 3, group: "s" } }, [A, { ...B, zoom: 9 }]);
    expect(locations.map(({ zoom }) => zoom)).toEqual([3, 9]);
    expect(convert({ commons: { group: "c" } }).locations[0]?.group).toBe("c");
  });

  it("hides markers for show_markers: false, but not over visible: true", () => {
    const { locations } = convert({ show_markers: false }, [A, { ...B, visible: true }]);
    expect(locations.map(({ visible }) => visible)).toEqual([false, true]);
  });

  it("drops popups for show_infowindows: false", () => {
    const { locations } = convert({ show_infowindows: false }, [{ ...A, html: "x" }]);
    expect(locations[0]?.html).toBeUndefined();
  });

  it.each([
    ["a variable", new Refused("Locs"), "Locs"],
    ["missing", undefined, "needs locations"],
    ["empty", [], "needs locations"],
    ["not a list", "x", "needs locations"],
    ["holding a non-object", [5], "Location 1"],
  ])("refuses locations that is %s", (_name, locations, words) => {
    expect(() => fromLegacyConfig({ locations }, createReport())).toThrow(words);
  });

  it("notes shared that isn't an object, and code in it", () => {
    expect(convert({ shared: null }).names).toEqual(["shared"]);
    expect(convert({ shared: new Refused("foo") }).notes[0]?.says).toContain("foo");
  });
});

describe("fromLegacyConfig's other options", () => {
  it("reports nothing of map_div or a marker type", () => {
    expect(convert({ map_div: "#map", type: "marker" }).names).toEqual([]);
  });

  it("reports what isn't carried, naming the code in it", () => {
    const { names, notes } = convert({
      map_options: { mapTypeId: new Refused("google.maps.MapTypeId.ROADMAP") },
      styles: {},
      type: "directions",
      afterShow: new Refused("function () {}"),
    });
    expect(names).toEqual(['type: "directions"', "map_options", "styles", "afterShow"]);
    expect(notes[1]?.says).toContain("google.maps.MapTypeId.ROADMAP");
    expect(notes[3]?.says).toContain("a function");
  });

  it("reports stroke_options beside no shape, and circle_options beside no circle", () => {
    const { names } = convert({ stroke_options: {}, circle_options: {} });
    expect(names).toEqual(["stroke_options", "circle_options"]);
  });
});

describe("fromLegacyConfig's shapes", () => {
  const stroke = { strokeColor: "#00f", fillColor: "#0f0" };

  it("keeps a polygon's points as markers, with one unlisted polygon of them", () => {
    const { locations, attributes: written } = convert(
      { type: "polygon", stroke_options: stroke },
      [A, B, C],
    );
    expect(locations).toHaveLength(4);
    expect(locations.at(-1)).toEqual({
      id: "4",
      type: "polygon",
      path: [
        { lat: 1, lng: 2 },
        { lat: 3, lng: 4 },
        { lat: 5, lng: 6 },
      ],
      listed: false,
      style: { stroke: "#00f", fill: "#0f0" },
    });
    expect(written[0]).toEqual(["list", "select"]);
  });

  it("gives a polyline the same without the fill", () => {
    const { locations, names } = convert({ type: "polyline", stroke_options: stroke });
    expect(locations.at(-1)?.style).toEqual({ stroke: "#00f" });
    expect(names).toEqual([]);
  });

  it("makes every location without a type a circle, its own marker staying one", () => {
    const { locations } = convert(
      { type: "circle", stroke_options: stroke, circle_options: { radius: 50 } },
      [A, { ...B, type: "marker" }],
    );
    expect(locations[0]).toMatchObject({ type: "circle", radius: 50, style: { stroke: "#00f" } });
    expect(locations[0]?.center).toEqual({ lat: 1, lng: 2 });
    expect(locations[1]).toMatchObject({ type: "marker", lat: 3 });
    expect(locations[1]?.style).toBeUndefined();
  });

  it("hides the points, not the shape or a circle, for show_markers: false", () => {
    const polygon = convert({ type: "polygon", show_markers: false }, [A, B, C]).locations;
    expect(polygon.map(({ visible }) => visible)).toEqual([false, false, false, undefined]);
    const circle = convert({ type: "circle", show_markers: false }).locations;
    expect(circle[0]?.visible).toBeUndefined();
  });

  it("lets start name a point", () => {
    expect(attribute({ type: "polygon", start: 2 }, "selected-id")).toBe("2");
  });

  it("gives the shape an id no explicit id has", () => {
    const { locations } = convert({ type: "polyline" }, [{ ...A, id: 3 }, B]);
    expect(locations.map(({ id }) => id)).toEqual(["3", "2", "4"]);
  });
});
