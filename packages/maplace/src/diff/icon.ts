import type { Icon, Location, LocationState, MarkerLocation } from "../location";
import { type Guard, guardedRenderer } from "../validate/guarded";
import { isMarker } from "./geometry";
import { sameValueSource } from "./same";

type IconRenderer = (state: LocationState) => Node | undefined;

/**
 * Builds a marker for a state: a URL as an image, a Node as itself, a function's result. Elements
 * carry `data-selected` and `data-hovered` while in that state, for CSS. A function that fails
 * is reported and builds nothing: the adapter draws its default marker.
 */
export function iconRenderer(
  location: Location,
  { report }: Pick<Guard, "report">,
): IconRenderer | undefined {
  if (!isMarker(location) || location.icon === undefined) return undefined;
  const guard = { locationId: location.id, field: "icon", report };
  const build = guardedRenderer(builderOf(location.icon, location), guard);
  return (state) => {
    const node = build(state);
    return node && stampState(node, state);
  };
}

/** Whether `next` draws the same marker as `previous`. */
export function sameIconSource(previous: Location, next: Location): boolean {
  return sameValueSource(iconOf(previous), iconOf(next));
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

function iconOf(location: Location): Icon | undefined {
  return isMarker(location) ? location.icon : undefined;
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
