import type { Drawable } from "../drawable";
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
 * The style a shape is drawn with in a state: its own style (the location's over the store's
 * default, with no undefined field: `Drawable`), over the state's look. Selected wins over
 * hovered; a polyline's look has line fields only. At rest, and for a marker, the drawable's own
 * style as it is.
 */
export function styleInState(
  { geometry, style }: Pick<Drawable, "geometry" | "style">,
  state: LocationState,
): ShapeStyle | undefined {
  if (geometry.type === "marker") return style;
  const look = lookIn(state, geometry.type === "polyline" ? LINE_LOOKS : AREA_LOOKS);
  return look === undefined ? style : { ...look, ...style };
}

/** One kind of shape's look for each state but rest. */
interface StateLooks {
  readonly selected: ShapeStyle;
  readonly hovered: ShapeStyle;
}

const LINE_LOOKS: StateLooks = { selected: SELECTED_LINE_LOOK, hovered: HOVERED_LINE_LOOK };
const AREA_LOOKS: StateLooks = { selected: SELECTED_LOOK, hovered: HOVERED_LOOK };

function lookIn({ selected, hovered }: LocationState, looks: StateLooks): ShapeStyle | undefined {
  if (selected) return looks.selected;
  if (hovered) return looks.hovered;
  return undefined;
}
