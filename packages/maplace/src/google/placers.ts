import { placeMarker } from "./marker";
import type { Placers } from "./placed-location";
import { SHAPE_PLACERS } from "./shape";

/** A placer for every geometry type: what `drawing.ts` places each location with. */
export const PLACERS: Placers = { marker: placeMarker, ...SHAPE_PLACERS };
