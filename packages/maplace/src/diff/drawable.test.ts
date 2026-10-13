import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { type DrawContext, type DrawnLocation, toDrawable } from "./drawable";

const CONTEXT: DrawContext = { sanitize: undefined, style: { stroke: "blue" }, report: () => {} };
const path = [
  { lat: 0, lng: 0 },
  { lat: 1, lng: 1 },
];

function drawn(location: Location): DrawnLocation {
  return { location, drawable: toDrawable(location, undefined, CONTEXT) };
}

describe("toDrawable", () => {
  it("resolves a location for the adapter", () => {
    const drawable = toDrawable(
      { id: "l", type: "polyline", path, title: "Walk" },
      undefined,
      CONTEXT,
    );
    expect(drawable).toMatchObject({
      id: "l",
      geometry: { type: "polyline", path },
      title: "Walk",
      style: { stroke: "blue" },
      editable: false,
      renderContent: undefined,
      renderIcon: undefined,
    });
  });

  it("keeps the geometry while the coordinates are the same", () => {
    const previous = drawn({ id: "a", lat: 1, lng: 2 });
    expect(toDrawable({ id: "a", lat: 1, lng: 2, title: "A" }, previous, CONTEXT).geometry).toBe(
      previous.drawable.geometry,
    );
    expect(toDrawable({ id: "a", lat: 1, lng: 3 }, previous, CONTEXT).geometry).toEqual({
      type: "marker",
      lat: 1,
      lng: 3,
    });
  });

  it("keeps the geometry while the path is the same array", () => {
    const previous = drawn({ id: "l", type: "polyline", path });
    const moved = toDrawable({ id: "l", type: "polyline", path: [...path] }, previous, CONTEXT);
    expect(
      toDrawable({ id: "l", type: "polyline", path, title: "x" }, previous, CONTEXT).geometry,
    ).toBe(previous.drawable.geometry);
    expect(moved.geometry).not.toBe(previous.drawable.geometry);
  });

  it("keeps the style while its fields are the same, even in a new object", () => {
    const previous = drawn({ id: "l", type: "polyline", path, style: { strokeWidth: 3 } });
    const next = toDrawable(
      { id: "l", type: "polyline", path, style: { strokeWidth: 3 } },
      previous,
      CONTEXT,
    );
    expect(next.style).toBe(previous.drawable.style);
  });

  it("keeps the content renderer while content is the same", () => {
    const previous = drawn({ id: "a", lat: 1, lng: 2, content: "Hi" });
    expect(
      toDrawable({ id: "a", lat: 9, lng: 2, content: "Hi" }, previous, CONTEXT).renderContent,
    ).toBe(previous.drawable.renderContent);
    expect(
      toDrawable({ id: "a", lat: 1, lng: 2, content: "Bye" }, previous, CONTEXT).renderContent,
    ).not.toBe(previous.drawable.renderContent);
  });

  it("keeps the icon renderer while the icon is the same", () => {
    const previous = drawn({ id: "a", lat: 1, lng: 2, icon: "/pin.svg" });
    expect(
      toDrawable({ id: "a", lat: 9, lng: 2, icon: "/pin.svg" }, previous, CONTEXT).renderIcon,
    ).toBe(previous.drawable.renderIcon);
  });

  it("returns the previous drawable when no field changed", () => {
    const previous = drawn({ id: "a", lat: 1, lng: 2, content: "Hi", data: { n: 1 } });
    expect(
      toDrawable({ id: "a", lat: 1, lng: 2, content: "Hi", data: { n: 2 } }, previous, CONTEXT),
    ).toBe(previous.drawable);
  });

  it("returns a new drawable when a scalar changed", () => {
    const previous = drawn({ id: "a", lat: 1, lng: 2 });
    const next = toDrawable({ id: "a", lat: 1, lng: 2, editable: true }, previous, CONTEXT);
    expect(next).not.toBe(previous.drawable);
    expect(next.editable).toBe(true);
    expect(next.geometry).toBe(previous.drawable.geometry);
  });
});
