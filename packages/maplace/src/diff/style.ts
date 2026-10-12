import type { Location } from "../location";
import type { LineStyle, ShapeStyle } from "../style";
import { isMarker } from "./geometry";

const LINE_STYLE_FIELDS: ReadonlySet<string> = new Set(
  Object.keys({
    stroke: true,
    strokeOpacity: true,
    strokeWidth: true,
  } satisfies Record<keyof LineStyle, true>),
);

/**
 * The location's style over the default, without `undefined` fields: line fields only for
 * polylines, none for markers, and `undefined` when nothing is left.
 */
export function styleOf(
  location: Location,
  defaultStyle: ShapeStyle | undefined,
): ShapeStyle | undefined {
  if (isMarker(location)) return undefined;
  const style = { ...definedFields(defaultStyle), ...definedFields(location.style) };
  return nonEmpty(location.type === "polyline" ? lineFields(style) : style);
}

function definedFields(style: ShapeStyle | undefined): ShapeStyle {
  return Object.fromEntries(Object.entries(style ?? {}).filter(([, value]) => value !== undefined));
}

function lineFields(style: ShapeStyle): LineStyle {
  return Object.fromEntries(Object.entries(style).filter(([key]) => LINE_STYLE_FIELDS.has(key)));
}

function nonEmpty(style: ShapeStyle): ShapeStyle | undefined {
  return Object.keys(style).length === 0 ? undefined : style;
}
