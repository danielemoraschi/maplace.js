// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { locationFromAttributes } from "./location-attributes";
import { elementWith as element } from "./testing/dom";

describe("locationFromAttributes", () => {
  it("reads tags from a space-separated attribute", () => {
    const tagged = element({ "location-id": "a", tags: "parking open-late" });
    expect(locationFromAttributes(tagged).tags).toEqual(["parking", "open-late"]);
  });

  it("ignores stray whitespace in tags", () => {
    const tagged = element({ "location-id": "a", tags: "  parking \n open-late " });
    expect(locationFromAttributes(tagged).tags).toEqual(["parking", "open-late"]);
    expect(locationFromAttributes(element({ "location-id": "a", tags: " " })).tags).toEqual([]);
  });

  it("no attribute, no tags", () => {
    expect(locationFromAttributes(element({ "location-id": "a" }))).not.toHaveProperty("tags");
  });

  it("reads a marker, leaving out what isn't written", () => {
    const marker = element({ "location-id": "rome", lat: "41.9", lng: "12.5", title: "Rome" });
    expect(locationFromAttributes(marker)).toEqual({
      id: "rome",
      title: "Rome",
      lat: 41.9,
      lng: 12.5,
    });
  });

  it("reads a circle's lat and lng as its centre", () => {
    const circle = element({
      "location-id": "c",
      type: "circle",
      lat: "1",
      lng: "2",
      radius: "300",
    });
    expect(locationFromAttributes(circle)).toEqual({
      id: "c",
      type: "circle",
      center: { lat: 1, lng: 2 },
      radius: 300,
    });
  });

  it("passes on values that aren't numbers as written, a blank one too", () => {
    const location = locationFromAttributes(element({ "location-id": "a", lat: "", lng: "east" }));
    expect(location).toMatchObject({ lat: "", lng: "east" });
  });

  it("reads a location's zoom as a number, or as written when it isn't one", () => {
    const zoomed = (zoom: string) => locationFromAttributes(element({ "location-id": "a", zoom }));
    expect(zoomed("9")).toMatchObject({ zoom: 9 });
    expect(zoomed("near")).toMatchObject({ zoom: "near" });
  });

  it.each(["listed", "editable"])(
    "reads %s as a boolean, or as written when it isn't true or false",
    (name) => {
      const read = (value: string) =>
        locationFromAttributes(element({ "location-id": "a", [name]: value }));
      expect(read("true")).toMatchObject({ [name]: true });
      expect(read("false")).toMatchObject({ [name]: false });
      expect(read("no")).toMatchObject({ [name]: "no" });
      expect(locationFromAttributes(element({ "location-id": "a" }))).not.toHaveProperty(name);
    },
  );

  it.each(["listed", "editable"])("reads a present %s attribute with no value as true", (name) => {
    const location = locationFromAttributes(element({ "location-id": "a", [name]: "" }));
    expect(location).toMatchObject({ [name]: true });
  });

  it("keeps the group and the popup content given", () => {
    const content = () => document.createTextNode("x");
    const location = locationFromAttributes(element({ "location-id": "a", group: "north" }), {
      content,
      icon: undefined,
    });
    expect(location).toMatchObject({ group: "north", content });
  });
});

describe("locationFromAttributes: shape styles", () => {
  const circle = { "location-id": "c", type: "circle", lat: "1", lng: "2", radius: "3" };

  it("reads a shape's styles from shape-style, selected-style and hovered-style as JSON", () => {
    const styled = element({
      ...circle,
      "shape-style": '{"stroke":"#0000ff"}',
      "selected-style": '{"fill":"#ff0000"}',
      "hovered-style": '{"strokeWidth":3}',
    });
    expect(locationFromAttributes(styled)).toMatchObject({
      style: { stroke: "#0000ff" },
      selectedStyle: { fill: "#ff0000" },
      hoveredStyle: { strokeWidth: 3 },
    });
  });

  it("passes on a style that isn't JSON as written", () => {
    const location = locationFromAttributes(element({ ...circle, "selected-style": "red" }));
    expect(location).toMatchObject({ selectedStyle: "red" });
  });

  it("leaves the styles out when they aren't written", () => {
    expect(Object.keys(locationFromAttributes(element(circle)))).toEqual([
      "id",
      "type",
      "center",
      "radius",
    ]);
  });
});
