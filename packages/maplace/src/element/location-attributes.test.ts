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
    const location = locationFromAttributes(
      element({ "location-id": "a", group: "north" }),
      content,
    );
    expect(location).toMatchObject({ group: "north", content });
  });
});
