// Compile-time checks of pointAlong: each @ts-expect-error must stay an error.

import {
  type LatLng,
  type MarkerLocation,
  type PolylineLocation,
  pointAlong,
  type RouteResult,
} from "@maplacejs/maplace";
import { expectTypeOf } from "vitest";

declare const line: PolylineLocation;
declare const result: RouteResult;
declare const marker: MarkerLocation;

expectTypeOf(pointAlong(line, 0.5)).toEqualTypeOf<LatLng>();
expectTypeOf(pointAlong(result, 1)).toEqualTypeOf<LatLng>();

// @ts-expect-error: a marker is no line.
pointAlong(marker, 0.5);

// @ts-expect-error: the fraction is a number.
pointAlong(line, "half");
