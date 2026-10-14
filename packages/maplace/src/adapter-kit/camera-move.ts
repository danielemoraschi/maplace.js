import type { Geometry, LatLng } from "../geometry";
import type { Bounds, ResolvedView } from "../viewport";
import { anchorOf } from "./anchor";
import { fitBox, type MapSize } from "./web-mercator";

/**
 * The closest a fit zooms in (RFC): a box that would need more, as one location or locations
 * metres apart, is shown at this zoom, the streets around it rather than one building.
 */
export const FIT_MAX_ZOOM = 15;

/**
 * How a map's camera gets to a view: fitting a box its own way, jumping to a centre and zoom, or
 * panning there at the zoom it has.
 */
export type CameraMove =
  | { readonly kind: "fit"; readonly bounds: Bounds; readonly padding: number }
  | { readonly kind: "jump"; readonly center: LatLng; readonly zoom: number }
  | { readonly kind: "pan"; readonly center: LatLng };

/** What a move needs from the map: where a placed location is, and the map's size. */
export interface CameraSite {
  /** Undefined while the location isn't placed. */
  geometryOf(id: string): Geometry | undefined;
  /** Read only for a fit: a provider may have to lay the page out to answer. */
  size(): MapSize;
}

/**
 * The move a view asks for, the same on every map; undefined while a `location` view names a
 * location not placed yet. A location is brought to the point its popup points at.
 */
export function cameraMove(view: ResolvedView, site: CameraSite): CameraMove | undefined {
  switch (view.kind) {
    case "center":
      return { kind: "jump", center: view.center, zoom: view.zoom };
    case "location":
      return locationMove(view, site);
    case "fit-bounds":
      return fitMove(view, site.size());
  }
}

type LocationView = Extract<ResolvedView, { kind: "location" }>;
type BoundsView = Extract<ResolvedView, { kind: "fit-bounds" }>;

function locationMove({ id, zoom }: LocationView, site: CameraSite): CameraMove | undefined {
  const geometry = site.geometryOf(id);
  if (geometry === undefined) return undefined;
  const center = anchorOf(geometry);
  return zoom === undefined ? { kind: "pan", center } : { kind: "jump", center, zoom };
}

/**
 * A box the map fits itself, unless it would zoom past the cap: then the cap's zoom, centred as
 * the fit would be. The map's own fit lands at or below the whole zoom computed here, so the two
 * agree on which boxes reach the cap.
 */
function fitMove({ bounds, padding }: BoundsView, size: MapSize): CameraMove {
  const fitted = fitBox(bounds, { size, padding });
  return fitted.zoom < FIT_MAX_ZOOM
    ? { kind: "fit", bounds, padding }
    : { kind: "jump", center: fitted.center, zoom: FIT_MAX_ZOOM };
}
