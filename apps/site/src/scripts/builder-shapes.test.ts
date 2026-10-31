import { describe, expect, it } from "vitest";
import { Refused } from "./builder-literal.ts";
import { createReport } from "./builder-report.ts";
import { circleFromLegacy, lineStyleOf, pathShape, styleFromLegacy } from "./builder-shapes.ts";

const namesIn = (report: ReturnType<typeof createReport>) => report.notes().map(({ name }) => name);

describe("styleFromLegacy", () => {
  it("maps each style key", () => {
    const options = {
      strokeColor: "#111",
      strokeOpacity: 0.5,
      strokeWeight: 3,
      fillColor: "#222",
      fillOpacity: 0.2,
    };
    expect(styleFromLegacy(options, "stroke_options", createReport())).toEqual({
      stroke: "#111",
      strokeOpacity: 0.5,
      strokeWidth: 3,
      fill: "#222",
      fillOpacity: 0.2,
    });
  });

  it("reports another key under its option, once", () => {
    const report = createReport();
    styleFromLegacy({ clickable: true }, "stroke_options", report);
    styleFromLegacy({ clickable: false }, "stroke_options", report);
    expect(namesIn(report)).toEqual(["stroke_options.clickable"]);
  });

  it("drops code and names it", () => {
    const report = createReport();
    const style = styleFromLegacy({ strokeColor: new Refused("foo()") }, "stroke_options", report);
    expect(style).toEqual({});
    expect(report.notes()[0]?.says).toContain("foo()");
  });

  it("names code that stands for the whole option", () => {
    const report = createReport();
    styleFromLegacy(new Refused("opts"), "circle_options", report);
    expect(report.notes()[0]?.says).toContain("opts");
  });

  it("notes what isn't an object", () => {
    const report = createReport();
    expect(styleFromLegacy("x", "circle_options", report)).toEqual({});
    expect(namesIn(report)).toEqual(["circle_options"]);
  });
});

describe("lineStyleOf", () => {
  it("leaves out the fill", () => {
    expect(lineStyleOf({ stroke: "a", fill: "b", fillOpacity: 1 })).toEqual({ stroke: "a" });
  });
});

describe("circleFromLegacy", () => {
  const circle = (fields: Record<string, unknown>, report = createReport()) =>
    circleFromLegacy({ id: "1", type: "circle", lat: 1, lng: 2, ...fields }, report);

  it("takes its center from lat and lng, and 0.2's 100 for a radius", () => {
    expect(circle({})).toEqual({
      id: "1",
      type: "circle",
      center: { lat: 1, lng: 2 },
      radius: 100,
    });
  });

  it("takes circle_options' radius over its own", () => {
    expect(circle({ radius: 500 }).radius).toBe(500);
    expect(circle({ radius: 500, circle_options: { radius: 9 } }).radius).toBe(9);
  });

  it("lets circle_options style over stroke_options, and its own style over both", () => {
    const { style } = circle({
      stroke_options: { strokeColor: "a", fillColor: "a", strokeWeight: 1 },
      circle_options: { strokeColor: "b", fillColor: "b" },
      style: { fill: "c" },
    });
    expect(style).toEqual({ stroke: "b", fill: "c", strokeWidth: 1 });
  });

  it("is hidden by circle_options.visible alone, not a point's visible", () => {
    expect(circle({ circle_options: { visible: false } }).visible).toBe(false);
    expect(circle({ visible: false }).visible).toBeUndefined();
  });

  it("reports an icon", () => {
    const report = createReport();
    expect(circle({ icon: "a.png" }, report).icon).toBeUndefined();
    expect(namesIn(report)).toEqual(["icon"]);
  });
});

describe("pathShape", () => {
  const points = [
    { id: "1", lat: 1, lng: 2 },
    { id: "3", lat: 3, lng: 4 },
  ];

  it("holds the points in order, off the list, its id the next free number", () => {
    const shape = pathShape("polygon", points, { fillColor: "a" }, createReport());
    expect(shape).toEqual({
      id: "4",
      type: "polygon",
      path: [
        { lat: 1, lng: 2 },
        { lat: 3, lng: 4 },
      ],
      listed: false,
      style: { fill: "a" },
    });
  });

  it("gives a polyline no fill, silently", () => {
    const report = createReport();
    expect(pathShape("polyline", points, { fillColor: "a" }, report).style).toBeUndefined();
    expect(report.notes()).toEqual([]);
  });
});
