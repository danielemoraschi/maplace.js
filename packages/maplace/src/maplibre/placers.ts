import { placeMarker } from "./marker";
import type { Placers } from "./placed-location";
import { placeShape } from "./shape";

export const PLACERS: Placers = { marker: placeMarker, polyline: placeShape, polygon: placeShape };
