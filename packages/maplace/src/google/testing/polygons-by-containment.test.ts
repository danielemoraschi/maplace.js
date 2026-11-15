import { describe, expect, it } from "vitest";
import type { LatLng } from "../../geometry";
import { squareAround } from "../../testing/conformance/fixtures";
import { polygonsByContainment } from "./polygons-by-containment";

const square = (lng: number, size: number): LatLng[] => squareAround({ lat: 0, lng }, size);

describe("polygonsByContainment", () => {
  it("makes a ring inside an earlier outline that outline's hole", () => {
    expect(polygonsByContainment([square(0, 2), square(0, 1)])).toEqual([
      { path: square(0, 2), holes: [square(0, 1)] },
    ]);
  });

  it("makes a ring outside every earlier outline a polygon of its own", () => {
    expect(polygonsByContainment([square(0, 2), square(0, 1), square(5, 2)])).toEqual([
      { path: square(0, 2), holes: [square(0, 1)] },
      { path: square(5, 2), holes: undefined },
    ]);
  });
});
