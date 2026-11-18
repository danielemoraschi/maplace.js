import { isSplitLine } from "../adapter-kit/line-parts";
import type { Look } from "../adapter-kit/presentation-changes";
import { sameStyles, styleInState } from "../adapter-kit/shape-looks";
import { frontRank } from "../adapter-kit/stacking";
import type { Drawable } from "../drawable";
import { sameState } from "../location-state";
import { type StyleValues, styleValues } from "./shape-style";

/** A shape's whole style on Google as it shows it in `look`: its state's, its own stroke too. */
export function shownStyleValues(drawable: Drawable, look: Look): StyleValues {
  const values = styleValues(styleInState(drawable, look.state));
  if (!isOutlineLifted(drawable, look) && !isParted(drawable, look)) return values;
  // Its width kept, so the pointer still finds it where it is drawn.
  return { ...values, strokeOpacity: 0, icons: undefined };
}

/**
 * Whether a shape's outline is drawn again over the others by a copy (`liftedOutline`): while it
 * is in front (hovered or selected), shown, not editable and not split at a progress (its parts
 * are lifted instead), its own stroke hidden meanwhile.
 */
export function isOutlineLifted(drawable: Drawable, look: Look): boolean {
  const inFront = frontRank(look.state) !== undefined && look.visible;
  return inFront && !drawable.editable && !isParted(drawable, look);
}

/** Whether a line is drawn by its parts at its progress (`line-parts.ts`), its own stroke hidden. */
function isParted(drawable: Drawable, { visible }: Look): boolean {
  return visible && isSplitLine(drawable);
}

/**
 * Whether a shape shows the same style in `after` as in `before`: the same styles, state and
 * active flag, and its stroke hidden in both or neither. What its parts or its outline copy show
 * is theirs to redraw.
 */
export function sameShownStyle(
  [before, lookBefore]: readonly [Drawable, Look],
  [after, lookAfter]: readonly [Drawable, Look],
): boolean {
  return (
    sameStyles(before, after) &&
    before.active === after.active &&
    sameState(lookBefore.state, lookAfter.state) &&
    isOutlineLifted(before, lookBefore) === isOutlineLifted(after, lookAfter) &&
    isParted(before, lookBefore) === isParted(after, lookAfter)
  );
}
