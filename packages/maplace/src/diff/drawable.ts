import type { Drawable, StyleField } from "../drawable";
import type { Location } from "../location";
import { type ContentContext, contentRenderer, sameContentSource } from "./content";
import { geometryOf } from "./geometry";
import { iconRenderer, sameIconSource } from "./icon";
import { keepIfSame } from "./same";
import { type DrawStyles, styleOf } from "./style";

/**
 * What drawables depend on besides the location: the store's options, and where the page's own
 * code reports failing while an adapter draws. Fixed for one attachment.
 */
export interface DrawContext extends ContentContext, DrawStyles {}

/** A location as last given, with the drawable made from it. */
export interface DrawnLocation {
  readonly location: Location;
  readonly drawable: Drawable;
}

/**
 * Resolves a location for the adapter. Each field that did not change keeps the reference it
 * had in `previous`, and when none changed, `previous.drawable` itself comes back.
 */
export function toDrawable(
  location: Location,
  previous: DrawnLocation | undefined,
  context: DrawContext,
): Drawable {
  const keptStyle = (field: StyleField) =>
    keepIfSame(previous?.drawable[field], styleOf(location, field, context[field]));
  const drawable: Drawable = {
    id: location.id,
    geometry: keepIfSame(previous?.drawable.geometry, geometryOf(location)),
    title: location.title,
    style: keptStyle("style"),
    selectedStyle: keptStyle("selectedStyle"),
    hoveredStyle: keptStyle("hoveredStyle"),
    editable: location.editable ?? false,
    renderContent: contentRendererOf(location, previous, context),
    renderIcon: iconRendererOf(location, previous, context),
  };
  return keepIfSame(previous?.drawable, drawable);
}

function contentRendererOf(
  location: Location,
  previous: DrawnLocation | undefined,
  context: DrawContext,
): Drawable["renderContent"] {
  return previous !== undefined && sameContentSource(previous.location, location)
    ? previous.drawable.renderContent
    : contentRenderer(location, context);
}

function iconRendererOf(
  location: Location,
  previous: DrawnLocation | undefined,
  context: DrawContext,
): Drawable["renderIcon"] {
  return previous !== undefined && sameIconSource(previous.location, location)
    ? previous.drawable.renderIcon
    : iconRenderer(location, context);
}
