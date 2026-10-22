import { placeMarker } from "./marker";
import type { Placers } from "./placed-location";
import { placeShape } from "./shape";

export const PLACERS: Placers = {
  marker: placeMarker,
  circle: placeShape,
  polyline: placeShape,
  polygon: placeShape,
};
