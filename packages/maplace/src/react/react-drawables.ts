import type { Drawable } from "../drawable";
import type { LocationState } from "../location";
import type { Asks } from "./content-renders";
import type { ContentHosts } from "./content-slots";

/** Whether a location is still drawn under its id: removed, its old builders ask for nothing. */
interface Drawing {
  live: boolean;
}

/** A drawable as the store gave it, the one the adapter got instead, and its drawing. */
export interface Wrapped {
  readonly original: Drawable;
  readonly drawable: Drawable;
  readonly drawing: Drawing;
}

/**
 * `next` with builders that ask the session first. A wrapped builder is kept while the one it
 * wraps is, so the adapter redraws only what changed; a location with no content or icon of its
 * own gets one too, since React's may be all it has.
 */
export function reactDrawable(
  next: Drawable,
  previous: Wrapped | undefined,
  session: ContentHosts,
  asks: Asks,
): Wrapped {
  if (previous?.original === next) return previous;
  const drawing = previous?.drawing ?? { live: true };
  const renderContent = asks.popup
    ? keptOr(previous, next, "renderContent", () => popupBuilder(next, drawing, session))
    : next.renderContent;
  const renderIcon = asks.icon
    ? keptOr(previous, next, "renderIcon", () => iconBuilder(next, drawing, session))
    : next.renderIcon;
  return { original: next, drawing, drawable: { ...next, renderContent, renderIcon } };
}

/** The builder wrapped last time when the one it wraps is the same, else a new one. */
function keptOr<K extends "renderContent" | "renderIcon">(
  previous: Wrapped | undefined,
  next: Drawable,
  key: K,
  wrap: () => Drawable[K],
): Drawable[K] {
  if (previous === undefined) return wrap();
  return previous.original[key] === next[key] ? previous.drawable[key] : wrap();
}

function popupBuilder(drawable: Drawable, drawing: Drawing, session: ContentHosts) {
  const { id, renderContent: own } = drawable;
  return () => (drawing.live ? session.popupFor(id) : undefined) ?? own?.();
}

function iconBuilder(drawable: Drawable, drawing: Drawing, session: ContentHosts) {
  const { id, renderIcon: own } = drawable;
  return (state: LocationState) =>
    (drawing.live ? session.iconFor(id, state) : undefined) ?? own?.(state);
}
