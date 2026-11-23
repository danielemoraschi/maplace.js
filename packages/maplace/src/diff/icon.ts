import {
  type Icon,
  isMarkerLocation,
  type Location,
  type LocationState,
  type MarkerLocation,
} from "../location";
import { type Guard, guardedRenderer } from "../validate/guarded";
import { sameValueSource } from "./same";

type IconRenderer = (state: LocationState) => Node | undefined;

/** What a marker's icon depends on besides its location: the store's icon for every marker. */
export interface IconContext extends Pick<Guard, "report"> {
  readonly markerIcon?: Icon | undefined;
}

/**
 * Builds a marker for a state: its own `icon`, else the store's `markerIcon`; a URL as an image,
 * a Node as itself (the store's copied, once for each marker, as one Node can't mark two), a
 * function's result. Elements carry `data-selected` and `data-hovered` while in that state, for
 * CSS. A function that fails is reported, under the field it came from, and builds nothing: the
 * adapter draws its default marker.
 */
export function iconRenderer(
  location: Location,
  { report, markerIcon }: IconContext,
): IconRenderer | undefined {
  if (!isMarkerLocation(location)) return undefined;
  const source = iconSourceOf(location, markerIcon);
  if (source === undefined) return undefined;
  const { builder, field } = source;
  const build = guardedRenderer(builder, { locationId: location.id, field, report });
  return (state) => {
    const node = build(state);
    return node && stampState(node, state);
  };
}

/**
 * Whether `next` draws the same marker as `previous`: the same icon, its own or the store's
 * `markerIcon`. A function never is, so it is never kept bound to an old location.
 */
export function sameIconSource(
  previous: Location,
  next: Location,
  markerIcon: Icon | undefined,
): boolean {
  return sameValueSource(iconOf(previous, markerIcon), iconOf(next, markerIcon));
}

/** Sets the attributes of the states the marker is in, removes the others; returns the marker. */
export function stampState<N extends Node>(node: N, state: LocationState): N {
  if (isElement(node)) {
    node.toggleAttribute("data-selected", state.selected);
    node.toggleAttribute("data-hovered", state.hovered);
  }
  return node;
}

function builderOf(icon: Icon, location: MarkerLocation): (state: LocationState) => Node {
  if (typeof icon === "function") return (state) => icon(location, state);
  return valueBuilder(icon);
}

// Built apart from the location, so a kept renderer doesn't keep an old location alive.
function valueBuilder(icon: string | Node): () => Node {
  return typeof icon === "string" ? () => imageIcon(icon) : () => icon;
}

/** Where a marker's icon comes from, the field its failure is reported under, and its builder. */
interface IconSource {
  readonly field: "icon" | "markerIcon";
  readonly builder: (state: LocationState) => Node;
}

/** The marker's own icon, else the store's `markerIcon`; none when it has neither. */
function iconSourceOf(
  location: MarkerLocation,
  markerIcon: Icon | undefined,
): IconSource | undefined {
  if (location.icon !== undefined) {
    return { field: "icon", builder: builderOf(location.icon, location) };
  }
  if (markerIcon === undefined) return undefined;
  // The store's Node is copied for each marker, once, and kept across its states.
  const builder =
    typeof markerIcon === "object"
      ? copiedNodeBuilder(markerIcon)
      : builderOf(markerIcon, location);
  return { field: "markerIcon", builder };
}

function copiedNodeBuilder(node: Node): () => Node {
  let copy: Node | undefined;
  return () => {
    copy ??= node.cloneNode(true);
    return copy;
  };
}

function iconOf(location: Location, markerIcon: Icon | undefined): Icon | undefined {
  return isMarkerLocation(location) ? (location.icon ?? markerIcon) : undefined;
}

// An empty alt: the marker's accessible name is the location's title, set by the adapter.
function imageIcon(url: string): HTMLImageElement {
  const image = document.createElement("img");
  image.src = url;
  image.alt = "";
  return image;
}

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}
