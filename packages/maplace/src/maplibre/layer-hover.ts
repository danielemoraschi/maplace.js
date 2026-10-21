import type { MapMouseEvent } from "maplibre-gl";
import type { HoverReports } from "../adapter-kit/hover-reports";
import { isInOwnMarker } from "./dom-marker";
import type { MapPart } from "./mounted-map";
import { isOnCanvas } from "./pointer-targets";

/**
 * Hover on what is drawn in maplace's layers: the location under the pointer (`locationAt` says
 * which), reported through the map's one hover, the cursor a pointer over it. Off the map, or over
 * something on it, no layer location is pointed at; onto one of maplace's DOM markers, which reports
 * its own hover (perhaps the same location's, its pin becoming its icon), the layer lets go without
 * a report.
 */
export function layerHover(
  locationAt: (event: MapMouseEvent) => string | undefined,
  hoverOf: () => HoverReports | undefined,
): MapPart {
  return {
    open(mounted) {
      const { map } = mounted;
      const canvas = map.getCanvas();
      let pointed: string | undefined;
      const pointAt = (id: string | undefined) => {
        if (id === pointed) return;
        const hover = hoverOf();
        if (pointed !== undefined) hover?.leave("pointer", pointed);
        if (id !== undefined) hover?.enter("pointer", id);
        pointed = id;
        canvas.style.cursor = id === undefined ? "" : "pointer";
      };
      const onMove = (event: MapMouseEvent) => {
        if (isOnCanvas(event, canvas)) pointAt(locationAt(event));
        else if (isInOwnMarker(event.originalEvent.target)) handOver();
        else pointAt(undefined);
      };
      /** A DOM marker the pointer moved onto reports its own hover: the layer lets go, quietly. */
      const handOver = () => {
        pointed = undefined;
        canvas.style.cursor = "";
      };
      const onOut = (event: MapMouseEvent) => {
        if (isInOwnMarker(event.originalEvent.relatedTarget)) handOver();
        else pointAt(undefined);
      };
      map.on("mousemove", onMove);
      map.on("mouseout", onOut);
      mounted.onDestroy(() => {
        map.off("mousemove", onMove);
        map.off("mouseout", onOut);
        canvas.style.cursor = "";
      });
    },
  };
}
