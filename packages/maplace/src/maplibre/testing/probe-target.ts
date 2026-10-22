import type { Map as MapLibreMap } from "maplibre-gl";
import type { Geometry } from "../../geometry";
import type { LocationOnMap } from "../../testing/map-probe";
import type { SentFeatures } from "./sent-features";

/** Where a target is: the map it was placed on, what MapLibre was sent, and whether it still is. */
export interface TargetSite {
  readonly map: MapLibreMap;
  readonly sent: SentFeatures;
  /** The adapter still has it placed: a hidden location is on the map, though not drawn. */
  stillPlaced(): boolean;
}

/** One placed location as the probe sees and drives it, through what MapLibre was sent. */
export interface ProbeTarget {
  readonly isMarker: boolean;
  onMap(): boolean;
  /** On the map and not hidden: what a user can see and reach. */
  shown(): boolean;
  read(): LocationOnMap;
  /** Where it stacks among its kind, higher in front. */
  stack(): number;
  click(): void;
  pointerOver(): void;
  pointerOut(): void;
  /** Absent where the map doesn't let it be edited. */
  drag?(geometry: Geometry): void;
}
