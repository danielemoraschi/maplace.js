import type { ReactNode } from "react";
import type { Location, LocationState, MarkerLocation } from "../location";

/** A location's popup content as React content; nothing: the location's own `content`. */
export type PopupContentRender<Data> = (location: Location<Data>) => ReactNode;

/** A marker's icon as React content, for its state; nothing: its own `icon`, else the default. */
export type MarkerIconRender<Data> = (
  location: MarkerLocation<Data>,
  state: LocationState,
) => ReactNode;

export interface ContentRenders<Data> {
  readonly popupContent?: PopupContentRender<Data> | undefined;
  readonly markerIcon?: MarkerIconRender<Data> | undefined;
}

export type ContentField = keyof ContentRenders<unknown>;

/** Which builders ask React: those whose function was given when the map mounted. */
export interface Asks {
  readonly popup: boolean;
  readonly icon: boolean;
}

/** What `renders` asks React for, or undefined when it asks for nothing. */
export function asksOf<Data>({ popupContent, markerIcon }: ContentRenders<Data>): Asks | undefined {
  const asks = { popup: popupContent !== undefined, icon: markerIcon !== undefined };
  return asks.popup || asks.icon ? asks : undefined;
}

/**
 * Whether `call` renders something: not `null`, `undefined` or a boolean. One that throws does:
 * React's render calls it again and throws to the content's boundary.
 */
export function rendersAnything(call: () => ReactNode): boolean {
  try {
    return rendersSomething(call());
  } catch {
    return true;
  }
}

function rendersSomething(node: ReactNode): boolean {
  return node !== null && node !== undefined && typeof node !== "boolean";
}
