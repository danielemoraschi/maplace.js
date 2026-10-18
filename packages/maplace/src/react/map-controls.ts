import { createContext } from "react";
import type { Adapter } from "../adapter";

/** What a `<MaplaceMap>` gives the controls inside it: its map's `mountControl`, once attached. */
export interface MapControls {
  /** Undefined until the map's adapter is attached, and after it is detached. */
  readonly mountControl: Adapter["mountControl"] | undefined;
}

/** Undefined outside a `<MaplaceMap>`. */
export const MapControlsContext = createContext<MapControls | undefined>(undefined);
