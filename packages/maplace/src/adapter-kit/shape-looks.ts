import { type Drawable, STYLE_FIELDS, type StyleField } from "../drawable";
import type { LocationState } from "../location";
import type { LineStyle, ShapeStyle } from "../style";

/** How a selected polyline is drawn where its style leaves a field unset: heavier, opaque. */
export const SELECTED_LINE_LOOK: LineStyle = Object.freeze({ strokeWidth: 5, strokeOpacity: 1 });

/** A selected circle or polygon: the selected line, over a stronger fill. */
export const SELECTED_LOOK: ShapeStyle = Object.freeze({ ...SELECTED_LINE_LOOK, fillOpacity: 0.5 });

/** A hovered polyline, short of selected. */
export const HOVERED_LINE_LOOK: LineStyle = Object.freeze({ strokeWidth: 4 });

/** A hovered circle or polygon, short of selected. */
export const HOVERED_LOOK: ShapeStyle = Object.freeze({ ...HOVERED_LINE_LOOK, fillOpacity: 0.4 });

/**
 * The style a shape is drawn with in a state: the state's look, then its own style, then its
 * own style for that state (each the location's over the store's default, with no undefined
 * field: `Drawable`). Selected wins over hovered, its style too; a polyline's look has line
 * fields only. At rest, and for a marker, the drawable's own style as it is.
 */
export function styleInState(
  drawable: Pick<Drawable, "geometry" | StyleField>,
  state: LocationState,
): ShapeStyle | undefined {
  const { geometry, style } = drawable;
  if (geometry.type === "marker") return style;
  const line = geometry.type === "polyline";
  if (state.selected) {
    return { ...(line ? SELECTED_LINE_LOOK : SELECTED_LOOK), ...style, ...drawable.selectedStyle };
  }
  if (state.hovered) {
    return { ...(line ? HOVERED_LINE_LOOK : HOVERED_LOOK), ...style, ...drawable.hoveredStyle };
  }
  return style;
}

/** Whether two drawables of one shape have the same styles: same references, so same look. */
export function sameStyles(a: Pick<Drawable, StyleField>, b: Pick<Drawable, StyleField>): boolean {
  return STYLE_FIELDS.every((field) => a[field] === b[field]);
}
