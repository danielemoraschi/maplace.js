import type { Geometry } from "../../geometry";
import type { LocationOnMap } from "../../testing/map-probe";

/** One placed location as the probe sees and drives it, through Google's own objects. */
export interface ProbeTarget {
  readonly isMarker: boolean;
  onMap(): boolean;
  /** On the map and not hidden: what a user can see and reach. */
  shown(): boolean;
  read(): LocationOnMap;
  /** Where it stacks within its layer, higher in front. */
  stack(): number;
  click(): void;
  pointerOver(): void;
  pointerOut(): void;
  /** Edits it as a user would, one handle at a time; nothing when it isn't editable. */
  drag(geometry: Geometry): void;
}
