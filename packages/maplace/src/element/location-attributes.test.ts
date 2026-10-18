// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { locationFromAttributes } from "./location-attributes";
import { elementWith as element } from "./testing/dom";

describe("locationFromAttributes", () => {
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
