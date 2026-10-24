/// <reference types="google.maps" preserve="true" />
import { editReportsFor } from "../adapter-kit/edit-reports";
import type { Geometry } from "../geometry";
import { cutOnBlur, type GiveBack, takeEditingAway } from "./blur-cuts";
import { latLngOf } from "./lat-lng";
import type { MountedMap } from "./mounted-map";
import type { PlacedMarker } from "./placed-location";

type Marker = PlacedMarker["marker"];

/** The marker's location as its drags need it. */
interface DraggedMarker {
  readonly id: string;
  readonly mounted: MountedMap;
  /** Whether the store has it editable now. */
  isEditable(): boolean;
}

/** What the marker's owner tells its drags. */
export interface MarkerDrags {
  /**
   * The page turned `editable` off: a drag under way reports nothing more. Returns whether a drag
   * was under way.
   */
  cutShort(): boolean;
  /** The marker is taken off: no blur ends its drags. */
  stop(): void;
}

/**
 * Reports one marker's drags while the map is live. Google fires `gmp-drag` as the marker moves
 * and `gmp-dragend` once, on release, so a drag reports its edits as it goes and its change once.
 * A window blur with a press held ends a drag under way where Google last placed the marker (the
 * RFC's `locationEdit`), and takes Google's own drag away until the press is let go, even one not
 * moved yet. Google's events are heard on the marker's own element and go with it; the blur's
 * cut is the map's, until `stop`.
 */
export function followMarkerDrags(
  marker: Marker,
  { id, mounted, isEditable }: DraggedMarker,
): MarkerDrags {
  const edits = editReportsFor(id, mounted.live);
  // Where Google last placed the marker in the drag under way; none between drags.
  let last: Geometry | undefined;

  marker.addEventListener("gmp-drag", () => {
    last = placeOf(marker) ?? last;
    if (last) edits.moving(last);
  });
  marker.addEventListener("gmp-dragend", () => {
    last = undefined;
    const ended = placeOf(marker);
    if (ended) edits.ended(ended);
  });

  /** Ends the drag under way, returning its last place; none when there is no drag. */
  function endDragUnderWay(): Geometry | undefined {
    const at = last;
    last = undefined;
    return at;
  }

  /** Google's drag taken away, and one under way ended where it was. */
  function cutByBlur(): GiveBack | undefined {
    const giveBack = takeEditingAway((on) => {
      marker.gmpDraggable = on;
    }, isEditable);
    const at = endDragUnderWay();
    // Last: the page's listener may close the map.
    if (at) edits.ended(at);
    return giveBack;
  }

  const stop = cutOnBlur(mounted, cutByBlur);
  return {
    cutShort() {
      const cut = endDragUnderWay() !== undefined;
      if (cut) edits.endedUnchanged();
      return cut;
    },
    stop,
  };
}

/** Where Google has the marker, as its geometry; none while Google gives it no position. */
function placeOf(marker: Marker): Geometry | undefined {
  const { position } = marker;
  return position ? { type: "marker", ...latLngOf(position) } : undefined;
}
