import type { Adapter } from "../adapter";
import type { Placers } from "./placed-location";

type NotYetDrawn = "setView" | "setRoute" | "mountControl";

/**
 * The contract methods this adapter doesn't draw yet: each takes its call and leaves the map as
 * it is. Each row from G4 to G8 replaces its method in `assemble.ts`; the last one deletes this
 * file.
 */
export const INERT_METHODS: Pick<Adapter, NotYetDrawn> = {
  setView: () => {},
  setRoute: () => {},
  mountControl: () => () => {},
};

const notPlaced = () => undefined;

/** The location types not drawn yet: skipped until G3 places shapes. */
export const NOT_YET_PLACED: Pick<Placers, "circle" | "polyline" | "polygon"> = {
  circle: notPlaced,
  polyline: notPlaced,
  polygon: notPlaced,
};
