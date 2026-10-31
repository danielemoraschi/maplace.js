import { describe, expect, it } from "vitest";
import { locationFromRecord, recordsWithIds } from "./builder-fields.ts";
import { Refused } from "./builder-literal.ts";
import { createReport } from "./builder-report.ts";

const mapped = (record: Record<string, unknown>, index = 0, report = createReport()) =>
  locationFromRecord(record, index, report);
const notesOf = (record: Record<string, unknown>) => {
  const report = createReport();
  const location = locationFromRecord(record, 0, report);
  return { location, names: report.notes().map(({ name }) => name), notes: report.notes() };
};

describe("locationFromRecord", () => {
  it("keeps 0.2's fields that 1.0 has and 1.0's own", () => {
    const kept = {
      lat: 1,
      lng: 2,
      title: "t",
      html: "h",
      icon: "i",
      zoom: 3,
      visible: false,
      group: "g",
      tags: ["a"],
      searchText: "s",
      data: { a: 1 },
    };
    expect(mapped(kept)).toEqual({ ...kept, id: "1" });
  });

  it.each([
    ["lon", "lng"],
    ["long", "lng"],
    ["longitude", "lng"],
    ["latitude", "lat"],
    ["name", "title"],
    ["draggable", "editable"],
  ])("writes %s as %s, unless the record has that one", (from, to) => {
    expect(mapped({ [from]: 7 })[to]).toBe(7);
    expect(mapped({ [from]: 7, [to]: 8 })[to]).toBe(8);
  });

  it("writes on_menu: false as listed: false", () => {
    expect(mapped({ on_menu: false }).listed).toBe(false);
    expect(mapped({ on_menu: true }).listed).toBeUndefined();
  });

  it("gives an id from a number, as a string, or from the position", () => {
    expect(mapped({ id: 5 }).id).toBe("5");
    expect(mapped({}, 2).id).toBe("3");
  });

  it("drops the popup for show_infowindow: false", () => {
    const location = mapped({ html: "x", content: "y", show_infowindow: false });
    expect(location.html).toBeUndefined();
    expect(location.content).toBeUndefined();
  });

  it("fills %index and %title once each, a $& in a title staying literal", () => {
    const location = mapped({ title: "a$&b", html: "%index %index %title %title" }, 1);
    expect(location.html).toBe("2 %index a$&b %title");
  });

  it("leaves %title when the title isn't a string", () => {
    expect(mapped({ title: 5, html: "%title" }).html).toBe("%title");
  });

  it("gives a missing title's %title nothing, as 0.2 did", () => {
    expect(mapped({ html: "[%title]" }).html).toBe("[]");
  });

  it("reports constructor, never finding it on the prototype", () => {
    const { names, notes } = notesOf({ constructor: "x" });
    expect(names).toEqual(["constructor"]);
    expect(notes[0]?.says).toBe("isn't a location field");
  });

  it("reports code, naming it, and leaves the field out", () => {
    const { location, notes } = notesOf({ animation: new Refused("google.maps.Animation.DROP") });
    expect(location.animation).toBeUndefined();
    expect(notes[0]?.says).toContain("google.maps.Animation.DROP");
    expect(notesOf({ icon: new Refused("() => 1") }).notes[0]?.says).toContain("a function");
  });

  it("reports 0.2's other fields in the migration table's words", () => {
    const { names, notes } = notesOf({ image: "a", stroke_options: {}, zIndex: 1 });
    expect(names).toEqual(["image", "stroke_options", "zIndex"]);
    expect(notes[0]?.says).toContain("is a 0.2 field");
  });

  it("names a field once across locations", () => {
    const report = createReport();
    mapped({ image: "a" }, 0, report);
    mapped({ image: "b" }, 1, report);
    expect(report.notes()).toHaveLength(1);
  });

  it("keeps a circle's options around the one value in them that is code", () => {
    const report = createReport();
    const circle = mapped(
      {
        type: "circle",
        lat: 1,
        lng: 2,
        circle_options: { radius: 500, fillColor: "#f00", strokeWeight: new Refused("w") },
      },
      0,
      report,
    );
    expect(circle).toMatchObject({ radius: 500, style: { fill: "#f00" } });
    expect(report.notes().map(({ name }) => name)).toEqual(["circle_options.strokeWeight"]);
  });

  it("reports a renamed field beside the name it would take", () => {
    expect(notesOf({ title: "A", name: "B" }).names).toEqual(["name"]);
  });

  it("gives null no field", () => {
    expect(mapped({ title: null, lon: null })).toEqual({ id: "1" });
  });

  it("makes a 0.2 circle, and passes a 1.0 one as written", () => {
    expect(mapped({ type: "circle", lat: 1, lng: 2 }).center).toEqual({ lat: 1, lng: 2 });
    const written = { type: "circle", center: { lat: 1, lng: 2 }, radius: 3 };
    expect(mapped(written)).toEqual({ ...written, id: "1" });
  });
});

describe("recordsWithIds", () => {
  it("treats 2 and '2' as one id, and gives a record without one the free position", () => {
    expect(recordsWithIds([{ id: "2" }, {}], createReport())).toEqual([{ id: "2" }, { id: "3" }]);
    expect(recordsWithIds([{ id: 2 }, {}], createReport())).toEqual([{ id: "2" }, { id: "3" }]);
  });

  it("stays linear on a long list whose ids sit after the records without", () => {
    const records = [
      ...Array.from({ length: 20_000 }, () => ({})),
      ...Array.from({ length: 20_000 }, (_, index) => ({ id: index + 1 })),
    ];
    const started = performance.now();
    const ids = recordsWithIds(records, createReport()).map(
      (record) => (record as { id: string }).id,
    );
    expect(performance.now() - started).toBeLessThan(2000);
    expect(new Set(ids).size).toBe(40_000);
  });

  it("reports an id that is code, in place of using it", () => {
    const report = createReport();
    expect(recordsWithIds([{ id: new Refused("foo()") }], report)).toEqual([{ id: "1" }]);
    expect(report.notes()[0]?.says).toContain("foo()");
  });

  it("leaves what isn't a record", () => {
    expect(recordsWithIds([5, {}], createReport())).toEqual([5, { id: "2" }]);
  });
});
