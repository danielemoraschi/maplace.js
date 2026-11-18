/// <reference types="google.maps" preserve="true" />
import type { Look } from "../adapter-kit/presentation-changes";
import { styleInState } from "../adapter-kit/shape-looks";
import { frontRank } from "../adapter-kit/stacking";
import type { Drawable } from "../drawable";
import type { Geometry } from "../geometry";
import type { MountedMap } from "./mounted-map";
import { isOutlineLifted } from "./own-stroke";
import type { GoogleShape } from "./placed-location";
import type { ShapeKind } from "./shape-kinds";
import { styleValues } from "./shape-style";

/** A shape's outline drawn again over the other shapes, while its shape is hovered or selected. */
export interface LiftedOutline {
  /** Draws it for the shape as it is now, or takes it off. */
  draw(drawable: Drawable, look: Look): void;
  /** The copy drawing it, while one is on the map: the stroke a user sees. */
  copy(): GoogleShape | undefined;
  remove(): void;
}

/**
 * Google draws a shape's stroke with its fill, at one `zIndex`, and shapes stack by size, so a
 * smaller neighbour drawn over a hovered or selected shape's edge hides half its outline.
 *
 * While the shape is in front (`frontRank`) and shown, a copy of the same kind draws its outline
 * again over every shape: unfilled, and not clickable, so the pointer reaches what it did, dashed
 * as the shape is. The shape hides its own stroke meanwhile (`isOutlineLifted`), so a see-through
 * stroke isn't drawn twice. The copy's geometry is set again only when it changes, as a country's
 * many rings cost a redraw.
 *
 * None for an editable shape: Google draws its handles on the shape itself, and a copy would lag
 * behind a drag.
 */
export function liftedOutline(kind: ShapeKind, { map, libraries }: MountedMap): LiftedOutline {
  let outline: GoogleShape | undefined;
  let outlined: Geometry | undefined;
  const remove = () => {
    outline?.setMap(null);
    outline = undefined;
    outlined = undefined;
  };
  return {
    draw(drawable, look) {
      if (!isOutlineLifted(drawable, look)) {
        remove();
        return;
      }
      const { state } = look;
      const created = outline === undefined;
      outline ??= kind.create(libraries.maps);
      if (drawable.geometry !== outlined) {
        kind.show(outline, drawable.geometry);
        outlined = drawable.geometry;
      }
      const style = styleValues(styleInState(drawable, state));
      outline.setValues({ ...style, fillOpacity: 0, zIndex: frontRank(state), clickable: false });
      // On the map once drawn and styled: never a frame in Google's default look.
      if (created) outline.setMap(map);
    },
    copy: () => outline,
    remove,
  };
}
