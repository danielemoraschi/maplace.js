import { type ReactNode, useContext, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ControlPosition } from "../adapter";
import { MapControlsContext, mapControlsOf } from "./map-controls";

export interface MapControlProps {
  /** The corner of the map it goes in. */
  readonly position: ControlPosition;
  readonly children?: ReactNode;
}

/**
 * Its children, the page's own content shown as given, on the map in a corner through the
 * adapter's `mountControl`: inside a `<MaplaceMap>`, while its map is attached. They keep the
 * provider's context, so a `<LocationList>` works there; `<LocationList position>` puts the list
 * itself in the map's panel instead. Rendered on the server, it is nothing.
 */
export function MapControl({ position, children }: MapControlProps): ReactNode {
  const { mountControl } = mapControlsOf(useContext(MapControlsContext), "MapControl:");
  const [node] = useState(() =>
    typeof document === "undefined" ? undefined : document.createElement("div"),
  );
  useLayoutEffect(() => {
    if (node === undefined || mountControl === undefined) return;
    return mountControl(node, position);
  }, [node, mountControl, position]);
  return node === undefined ? null : createPortal(children, node);
}
