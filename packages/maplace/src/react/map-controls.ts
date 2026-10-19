import { createContext } from "react";
import type { Adapter } from "../adapter";
import { MaplaceError } from "../index";

/** What a `<MaplaceMap>` gives the controls inside it: its map's `mountControl`, once attached. */
export interface MapControls {
  /** Undefined until the map's adapter is attached, and after it is detached. */
  readonly mountControl: Adapter["mountControl"] | undefined;
}

/** Undefined outside a `<MaplaceMap>`. */
export const MapControlsContext = createContext<MapControls | undefined>(undefined);

/** The `<MaplaceMap>`'s controls, or misuse in `subject`'s words when there is no map above it. */
export function mapControlsOf(controls: MapControls | undefined, subject: string): MapControls {
  if (controls === undefined) {
    throw new MaplaceError("invalid-input", `${subject} needs a <MaplaceMap> above it`);
  }
  return controls;
}
