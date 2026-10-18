import type { LocationDiff, PresentationState } from "../../adapter";
import { NOTHING_PRESENTED } from "../../adapter-kit/presentation-changes";
import type { Drawable } from "../../drawable";
import type { Geometry, LatLng } from "../../geometry";
import type { LocationState } from "../../location";

/** The number of locations a large diff has (RFC Numbers). */
export const LARGE_DIFF = 4000;

export const ORIGIN: LatLng = { lat: 0, lng: 0 };

/** A point off every location the checks draw, for a click on the map itself. */
export const AWAY: LatLng = { lat: 10, lng: 20 };

/** Towns a road joins, for routes: a provider finds no road between points at sea. */
export const TOWNS = {
  bologna: { lat: 44.4949, lng: 11.3426 },
  modena: { lat: 44.6471, lng: 10.9252 },
  ferrara: { lat: 44.8381, lng: 11.6198 },
} as const satisfies Record<string, LatLng>;

/** Markers `a`, `b` and `c` in the towns: on roads, and a few pixels apart at zoom 3. */
export function townMarkers(): Drawable[] {
  return [
    markerDrawable("a", TOWNS.bologna),
    markerDrawable("b", TOWNS.modena),
    markerDrawable("c", TOWNS.ferrara),
  ];
}

/** A marker as the store would hand it over: no title, style, content or icon unless given. */
export function markerDrawable(id: string, at = ORIGIN, overrides?: Partial<Drawable>): Drawable {
  return { ...plainDrawable(id), geometry: { type: "marker", ...at }, ...overrides };
}

export function circleDrawable(id: string, overrides?: Partial<Drawable>): Drawable {
  return {
    ...plainDrawable(id),
    geometry: { type: "circle", center: ORIGIN, radius: 1000 },
    ...overrides,
  };
}

export function polylineDrawable(id: string, overrides?: Partial<Drawable>): Drawable {
  return {
    ...plainDrawable(id),
    geometry: { type: "polyline", path: [ORIGIN, { lat: 1, lng: 1 }] },
    ...overrides,
  };
}

/** A square around the origin with a square hole. */
export function polygonDrawable(id: string, overrides?: Partial<Drawable>): Drawable {
  return {
    ...plainDrawable(id),
    geometry: { type: "polygon", path: square(2), holes: [square(1)] },
    ...overrides,
  };
}

/** Where a user moves one corner of `polygonDrawable`'s hole. */
export const MOVED_HOLE_CORNER: LatLng = { lat: 0.6, lng: 0.6 };

/** `polygonDrawable`'s geometry with one corner of its hole moved, as a user's edit leaves it. */
export function holeCornerMoved(): Geometry {
  const hole = square(1);
  hole[2] = MOVED_HOLE_CORNER;
  return { type: "polygon", path: square(2), holes: [hole] };
}

/** `drawable` moved or reshaped, as the store hands over a location whose geometry changed. */
export function reshaped(drawable: Drawable, geometry: Geometry): Drawable {
  return { ...drawable, geometry };
}

/** `drawable` with popup content: a new text node each time, as a content function builds. */
export function withContent(drawable: Drawable, text: string): Drawable {
  return { ...drawable, renderContent: () => document.createTextNode(text) };
}

/** `count` markers spread over the world, ids `m0`, `m1`, … */
export function manyMarkers(count: number): Drawable[] {
  return Array.from({ length: count }, (_, index) =>
    markerDrawable(`m${index}`, { lat: (index % 170) - 85, lng: (index % 360) - 180 }),
  );
}

export function adding(...drawables: Drawable[]): LocationDiff {
  return { added: drawables, updated: [], removed: [] };
}

export function updating(...drawables: Drawable[]): LocationDiff {
  return { added: [], updated: drawables, removed: [] };
}

export function removing(...ids: string[]): LocationDiff {
  return { added: [], updated: [], removed: ids };
}

/** A presentation: nothing selected, hovered or hidden unless given. */
export function presented(state: Partial<PresentationState>): PresentationState {
  return { ...NOTHING_PRESENTED, ...state };
}

/** A `renderIcon` that records each state it is asked for and builds one marker node. */
export function iconRecorder() {
  const states: LocationState[] = [];
  const node = document.createElement("span");
  const renderIcon = (state: LocationState): Node => {
    states.push(state);
    return node;
  };
  return { states, node, renderIcon };
}

/** The corners of a square centred on `center`, `size` degrees across. */
export function squareAround({ lat, lng }: LatLng, size: number): LatLng[] {
  const half = size / 2;
  return [
    { lat: lat - half, lng: lng - half },
    { lat: lat - half, lng: lng + half },
    { lat: lat + half, lng: lng + half },
    { lat: lat + half, lng: lng - half },
  ];
}

/** The corners of a square centred on the origin. */
function square(size: number): LatLng[] {
  return squareAround(ORIGIN, size);
}

function plainDrawable(id: string): Omit<Drawable, "geometry"> {
  return {
    id,
    title: undefined,
    style: undefined,
    selectedStyle: undefined,
    hoveredStyle: undefined,
    editable: false,
    renderContent: undefined,
    renderIcon: undefined,
  };
}
