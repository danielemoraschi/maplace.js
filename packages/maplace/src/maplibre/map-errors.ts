import type { ErrorEvent, Map as MapLibreMap } from "maplibre-gl";
import { MaplaceError } from "../errors";
import { isOwnSource } from "./layers";

/** Where the map's errors go: the ones maplace answers for; the rest are logged. */
interface ErrorRoutes {
  /** The style document failed to load. */
  styleFailed(error: MaplaceError): void;
  /** One of maplace's own sources failed: what the store asked to draw. */
  sourceFailed(error: MaplaceError): void;
}

/** A MapLibre error event, with what it names when a source or tile failed. */
type MapErrorEvent = ErrorEvent & { readonly sourceId?: string };

/** HTTP statuses saying the style's server refused the page: a key missing or wrong. */
const REFUSED = new Set([401, 403]);

/**
 * Routes every error the map fires until the returned function stops it. MapLibre logs an error
 * only while nothing listens, so this one listener answers for all of them: one on maplace's own
 * sources is the store's to hear; any other before the style document has loaded is the style's;
 * the rest (another source's, a tile's, a sprite's) is logged, as MapLibre would, unless the page
 * listens too, on its own map.
 */
export function routeMapErrors(map: MapLibreMap, routes: ErrorRoutes): () => void {
  let routing = true;
  const listener = ({ error, sourceId }: MapErrorEvent) => {
    // MapLibre still calls a listener taken off by one before it, for the same error.
    if (!routing) return;
    if (sourceId !== undefined && isOwnSource(sourceId)) routes.sourceFailed(drawFailure(error));
    else if (sourceId === undefined && map.getStyle() === undefined) {
      routes.styleFailed(styleErrorOf(error));
    } else if (!othersListen(map, listener)) console.error(error);
  };
  map.on("error", listener);
  return () => {
    routing = false;
    map.off("error", listener);
  };
}

/** Whether anything besides `own` listens to the map's errors: the page, on its own map. */
function othersListen(map: MapLibreMap, own: (event: MapErrorEvent) => void): boolean {
  map.off("error", own);
  const listened = map.listens("error");
  map.on("error", own);
  return listened;
}

/** maplace's locations failed to draw: what the store asked for didn't reach the map. */
export function drawFailure(cause: unknown): MaplaceError {
  const message = "apply: MapLibre failed to draw the locations";
  return new MaplaceError("provider-load-failed", message, { cause });
}

/** The load error for a style that failed: refused (401, 403), or failed to load. */
export function styleErrorOf(cause: unknown): MaplaceError {
  const status = statusOf(cause);
  if (status !== undefined && REFUSED.has(status)) {
    const message = `mount: the map style's server refused it (HTTP ${status}): check the key in its URL`;
    return new MaplaceError("provider-auth-failed", message, { cause });
  }
  return new MaplaceError("provider-load-failed", "mount: the map style failed to load", { cause });
}

/** The HTTP status of a failed request, as MapLibre's `AJAXError` carries it. */
function statusOf(cause: unknown): number | undefined {
  if (typeof cause !== "object" || cause === null || !("status" in cause)) return undefined;
  return typeof cause.status === "number" ? cause.status : undefined;
}
