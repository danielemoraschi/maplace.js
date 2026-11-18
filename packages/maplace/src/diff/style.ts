import { definedFields } from "../defined-fields";
import type { StyleField } from "../drawable";
import { isMarkerLocation, type Location } from "../location";
import type { MaplaceOptions } from "../options";
import { type DrawnStyle, LINE_STYLE_KEYS, type LineStyle, type ShapeStyle } from "../style";

/** The store's default for each of a drawable's styles. */
export type DrawStyles = { readonly [Field in StyleField]: MaplaceOptions[Field] };

const LINE_STYLE_FIELDS: ReadonlySet<string> = new Set(LINE_STYLE_KEYS);

/**
 * One of the location's styles over its default, without `undefined` fields: line fields only
 * for polylines, none for markers, and `undefined` when nothing is left.
 */
export function styleOf(
  location: Location,
  field: StyleField,
  defaultStyle: ShapeStyle | undefined,
): DrawnStyle | undefined {
  if (isMarkerLocation(location)) return undefined;
  const ownStyle = location[field];
  if (ownStyle === undefined && defaultStyle === undefined) return undefined;
  const style = { ...definedFields(defaultStyle), ...definedFields(ownStyle) };
  return nonEmpty(location.type === "polyline" ? lineFields(style) : style);
}

function lineFields(style: DrawnStyle): LineStyle {
  return Object.fromEntries(Object.entries(style).filter(([key]) => LINE_STYLE_FIELDS.has(key)));
}

function nonEmpty(style: DrawnStyle): DrawnStyle | undefined {
  return Object.keys(style).length === 0 ? undefined : style;
}
