import { type ReactNode, useContext, useLayoutEffect } from "react";
import { type ControlPosition, MY_LOCATION_CORNER } from "../adapter";
import { createMyLocationControl, type MyLocationOptions } from "../index";
import { MapControlsContext, mapControlsOf } from "./map-controls";
import { useMaplace } from "./maplace-provider";

export interface MyLocationProps extends MyLocationOptions {
  /** The corner of the map it goes in. Default top-left. */
  readonly position?: ControlPosition | undefined;
}

/** The "My location" control on the map, inside a `<MaplaceMap>`, while its map is attached. */
export function MyLocation({
  position = MY_LOCATION_CORNER,
  label,
  unavailableLabel,
}: MyLocationProps): ReactNode {
  const store = useMaplace();
  const { mountControl } = mapControlsOf(useContext(MapControlsContext), "MyLocation:");
  useLayoutEffect(() => {
    if (mountControl === undefined) return;
    const control = createMyLocationControl(store, { label, unavailableLabel });
    const takeOff = mountControl(control.element, position);
    return () => {
      takeOff();
      control.destroy();
    };
  }, [store, mountControl, position, label, unavailableLabel]);
  return null;
}
