import type { Marker } from "maplibre-gl";
import { type HoverReports, reportElementHover } from "../adapter-kit/hover-reports";
import type { LatLng } from "../geometry";
import { lngLatOf } from "./conversions";
import type { HandlePlace, HandleRole } from "./edit-geometry";
import { nearestLongitude } from "./location-features";
import type { MountedMapLibre } from "./mounted-map";

/** One handle a user drags to edit a shape: a draggable MapLibre marker. */
export interface EditHandle {
  readonly role: HandleRole;
  readonly marker: Marker;
}

/** What a shape's editing hears of a drag on one of its handles. */
export interface HandleDrags {
  /** The handle moved, and is still held. */
  moved(handle: EditHandle): void;
  /** The handle was let go. */
  dropped(handle: EditHandle): void;
}

/** The shape a handle edits, on its map. */
export interface EditedShape {
  readonly mounted: MountedMapLibre;
  readonly id: string;
  /** The map's one hover: the pointer on a handle hovers its shape. */
  readonly hover: HoverReports;
}

/** What every handle of one shape shares. */
export interface HandleOwner extends EditedShape {
  readonly drags: HandleDrags;
}

/** The handles whose element the pointer is on. */
const pointedAt = new WeakSet<EditHandle>();

/**
 * A handle at `place`, on the map: dragged with the mouse or a finger (MapLibre's own drag, which
 * keeps the map from panning), hovering its shape while the pointer is on it. Pointer-only, as
 * Google's handles: the list view is the keyboard's way to a location.
 */
export function placeHandle(place: HandlePlace, owner: HandleOwner): EditHandle {
  const { map, maplibre } = owner.mounted;
  const element = handleElement(map.getContainer().ownerDocument, place.role);
  const marker = new maplibre.Marker({ element, anchor: "center", draggable: true })
    .setLngLat(lngLatOf(place.at))
    .addTo(map);
  const handle: EditHandle = { role: place.role, marker };
  marker.on("drag", () => owner.drags.moved(handle));
  marker.on("dragend", () => owner.drags.dropped(handle));
  reportElementHover(element, owner.id, owner.hover);
  element.addEventListener("pointerenter", () => pointedAt.add(handle));
  element.addEventListener("pointerleave", () => pointedAt.delete(handle));
  return handle;
}

/**
 * Takes `handle` off the map. A handle taken off under the pointer hears no `pointerleave`, so
 * it lets the shape's hover go itself; a pointer since moved elsewhere is kept.
 */
export function removeHandle(handle: EditHandle, owner: HandleOwner): void {
  handle.marker.remove();
  if (pointedAt.delete(handle)) owner.hover.leave("pointer", owner.id);
}

/** Where the handle is now, as maplace's point, from whichever world copy MapLibre gives. */
export function handleAt(handle: EditHandle): LatLng {
  const { lat, lng } = handle.marker.getLngLat();
  return { lat, lng: nearestLongitude(lng, 0) };
}

/** Moves `handle` to `at`, unless it is there already: a marker moved writes to the DOM. */
export function moveHandle(handle: EditHandle, at: LatLng): void {
  const now = handle.marker.getLngLat();
  if (now.lat !== at.lat || now.lng !== at.lng) handle.marker.setLngLat(lngLatOf(at));
}

/**
 * A round white dot with a dark ring, a midpoint's fainter. Styled inline, as markup maplace
 * needs: a page's `data-maplace-unstyled` leaves it as it is.
 */
function handleElement(document: Document, role: HandleRole): HTMLElement {
  const element = document.createElement("div");
  element.className = "maplace-edit-handle";
  element.setAttribute("aria-hidden", "true");
  element.style.cssText = [
    "box-sizing: border-box",
    "width: 10px",
    "height: 10px",
    "border: 2px solid #333",
    "border-radius: 50%",
    "background: #fff",
    "cursor: grab",
    role.kind === "midpoint" ? "opacity: 0.5" : "",
  ].join(";");
  return element;
}
