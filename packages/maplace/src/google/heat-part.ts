import type { GoogleMapState } from "./map-state";
import type { MapPart } from "./mounted-map";

/** A heatmap on the open map, if its store asks for one: opened with it, kept in step after. */
export interface HeatPart {
  readonly part: MapPart;
  /** After a diff. */
  sync(): void;
  /** After a presentation. */
  present(): void;
}

/** The heat module the mount loaded (`heat-loading.ts`), or nothing on a map without a heatmap. */
export function createHeatPart(state: GoogleMapState): HeatPart {
  return {
    part: { open: (mounted) => mounted.heat?.open(mounted, state) },
    sync: () => state.mounted?.heat?.drawn(),
    present: () => state.mounted?.heat?.presented(),
  };
}
