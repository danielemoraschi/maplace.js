import type { Drawable } from "../drawable";
import type { Location } from "../location";
import type { MaplaceOptions } from "../options";
import { contentRenderer, sameContentSource } from "./content";
import { geometryOf } from "./geometry";
import { iconRenderer, sameIconSource } from "./icon";
import { keepIfSame } from "./same";
import { styleOf } from "./style";

/** The store options drawables depend on; fixed for the life of a store. */
export interface DrawContext {
  readonly sanitize: MaplaceOptions["sanitize"];
  readonly style: MaplaceOptions["style"];
}

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
  const drawable: Drawable = {
    id: location.id,
    geometry: keepIfSame(previous?.drawable.geometry, geometryOf(location)),
    title: location.title,
    style: keepIfSame(previous?.drawable.style, styleOf(location, context.style)),
    editable: location.editable ?? false,
    renderContent: contentRendererOf(location, previous, context),
    renderIcon: iconRendererOf(location, previous),
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
    : contentRenderer(location, context.sanitize);
}

function iconRendererOf(
  location: Location,
  previous: DrawnLocation | undefined,
): Drawable["renderIcon"] {
  return previous !== undefined && sameIconSource(previous.location, location)
    ? previous.drawable.renderIcon
    : iconRenderer(location);
}
