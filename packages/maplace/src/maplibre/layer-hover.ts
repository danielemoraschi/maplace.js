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
      const cursor = pointerCursor(canvas);
      let pointed: string | undefined;
      const setPointed = (id: string | undefined) => {
        if (pointed === undefined && id !== undefined) cursor.point();
        else if (pointed !== undefined && id === undefined) cursor.giveBack();
        pointed = id;
      };
      // Entered again while it stays pointed at: one hidden or folded under the pointer was let go
      // (`hover.gone`), and is hovered anew once drawn there again. A repeat reports nothing.
      const pointAt = (id: string | undefined) => {
        const hover = hoverOf();
        if (id !== pointed) {
          if (pointed !== undefined) hover?.leave("pointer", pointed);
          setPointed(id);
        }
        if (id !== undefined) hover?.enter("pointer", id);
      };
      /** A DOM marker the pointer moved onto reports its own hover: the layer lets go, quietly. */
      const handOver = () => setPointed(undefined);
      const onMove = (event: MapMouseEvent) => {
        if (isOnCanvas(event, canvas)) pointAt(locationAt(event));
        else if (isInOwnMarker(event.originalEvent.target)) handOver();
        else pointAt(undefined);
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
        setPointed(undefined);
      });
    },
  };
}

const POINTER = "pointer";

/**
 * The pointer cursor on the canvas while a location is pointed at, and the page's own cursor given
 * back after it, unless the page set another meanwhile.
 */
function pointerCursor(canvas: HTMLElement) {
  let pageCursor = "";
  return {
    point() {
      pageCursor = canvas.style.cursor;
      canvas.style.cursor = POINTER;
    },
    giveBack() {
      if (canvas.style.cursor === POINTER) canvas.style.cursor = pageCursor;
    },
  };
}
