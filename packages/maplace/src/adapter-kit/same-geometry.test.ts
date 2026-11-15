import { describe, expect, it } from "vitest";
import type { Geometry, LatLng } from "../geometry";
import { sameGeometry } from "./same-geometry";

const path: LatLng[] = [
  { lat: 0, lng: 0 },
  { lat: 1, lng: 0 },
  { lat: 0, lng: 1 },
];
const hole: LatLng[] = [
  { lat: 0.1, lng: 0.1 },
  { lat: 0.2, lng: 0.1 },
  { lat: 0.1, lng: 0.2 },
];

describe("sameGeometry", () => {
  it("compares by value, not by reference", () => {
    const polygon: Geometry = { type: "polygon", path, holes: [hole] };
    expect(sameGeometry(polygon, structuredClone(polygon))).toBe(true);
    expect(
      sameGeometry({ type: "marker", lat: 1, lng: 2 }, { type: "marker", lat: 1, lng: 2 }),
    ).toBe(true);
    expect(
      sameGeometry(
        { type: "circle", center: { lat: 1, lng: 2 }, radius: 3 },
        { type: "circle", center: { lat: 1, lng: 2 }, radius: 3 },
      ),
    ).toBe(true);
  });

  it("tells geometries of different types apart", () => {
    expect(sameGeometry({ type: "polyline", path }, { type: "polygon", path })).toBe(false);
  });

  it("tells apart any moved point, radius, or point added", () => {
    const moved = [path[0], path[1], { lat: 0, lng: 1.5 }] as LatLng[];
    expect(sameGeometry({ type: "polyline", path }, { type: "polyline", path: moved })).toBe(false);
    expect(
      sameGeometry(
        { type: "polyline", path },
        { type: "polyline", path: [...path, path[0] as LatLng] },
      ),
    ).toBe(false);
    expect(
      sameGeometry(
        { type: "circle", center: { lat: 1, lng: 2 }, radius: 3 },
        { type: "circle", center: { lat: 1, lng: 2 }, radius: 4 },
      ),
    ).toBe(false);
    expect(
      sameGeometry({ type: "marker", lat: 1, lng: 2 }, { type: "marker", lat: 1, lng: 3 }),
    ).toBe(false);
  });

  it("tells apart a moved hole point, and counts no holes as an empty list", () => {
    const polygon: Geometry = { type: "polygon", path, holes: [hole] };
    const movedHole = [hole[0], hole[1], { lat: 0.15, lng: 0.2 }] as LatLng[];
    expect(sameGeometry(polygon, { type: "polygon", path, holes: [movedHole] })).toBe(false);
    expect(sameGeometry(polygon, { type: "polygon", path })).toBe(false);
    expect(sameGeometry({ type: "polygon", path }, { type: "polygon", path, holes: [] })).toBe(
      true,
    );
  });

  it("compares a multipolygon's polygons in order, holes included", () => {
    const other = path.map(({ lat, lng }) => ({ lat: lat + 5, lng }));
    const country: Geometry = {
      type: "multipolygon",
      polygons: [{ path, holes: [hole] }, { path: other }],
    };
    expect(sameGeometry(country, structuredClone(country))).toBe(true);
    expect(
      sameGeometry(country, { type: "multipolygon", polygons: [{ path, holes: [hole] }] }),
    ).toBe(false);
    expect(
      sameGeometry(country, { type: "multipolygon", polygons: [{ path }, { path: other }] }),
    ).toBe(false);
    expect(sameGeometry(country, { type: "polygon", path })).toBe(false);
  });
});
