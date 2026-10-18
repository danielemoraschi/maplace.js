import type { StyleField } from "../drawable";
import type { Location } from "../location";
import type { MaplaceOptions } from "../options";
import type { LineStyle, ShapeStyle } from "../style";
import { isMarker } from "./geometry";

/** The store's default for each of a drawable's styles. */
export type DrawStyles = { readonly [Field in StyleField]: MaplaceOptions[Field] };

const LINE_STYLE_FIELDS: ReadonlySet<string> = new Set(
  Object.keys({
    stroke: true,
    strokeOpacity: true,
    strokeWidth: true,
  } satisfies Record<keyof LineStyle, true>),
);

/**
 * One of the location's styles over its default, without `undefined` fields: line fields only
 * for polylines, none for markers, and `undefined` when nothing is left.
 */
export function styleOf(
  location: Location,
  field: StyleField,
  defaultStyle: ShapeStyle | undefined,
): ShapeStyle | undefined {
  if (isMarker(location)) return undefined;
  const ownStyle = location[field];
  if (ownStyle === undefined && defaultStyle === undefined) return undefined;
  const style = { ...definedFields(defaultStyle), ...definedFields(ownStyle) };
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
