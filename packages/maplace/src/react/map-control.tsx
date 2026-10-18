import { type ReactNode, useContext, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ControlPosition } from "../adapter";
import { MaplaceError } from "../index";
import { MapControlsContext } from "./map-controls";

export interface MapControlProps {
  /** The corner of the map it goes in. */
  readonly position: ControlPosition;
  readonly children?: ReactNode;
}

/**
 * Its children on the map, in a corner, through the adapter's `mountControl`: inside a
 * `<MaplaceMap>`, while its map is attached. They keep the provider's context, so a
 * `<LocationList>` works there. Rendered on the server, it is nothing.
 */
export function MapControl({ position, children }: MapControlProps): ReactNode {
  const controls = useContext(MapControlsContext);
  if (controls === undefined) {
    throw new MaplaceError("invalid-input", "MapControl: needs a <MaplaceMap> above it");
  }
  const [node] = useState(() =>
    typeof document === "undefined" ? undefined : document.createElement("div"),
  );
  const { mountControl } = controls;
  useLayoutEffect(() => {
    if (node === undefined || mountControl === undefined) return;
    return mountControl(node, position);
  }, [node, mountControl, position]);
  return node === undefined ? null : createPortal(children, node);
}
