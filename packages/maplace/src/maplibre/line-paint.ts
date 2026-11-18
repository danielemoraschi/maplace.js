import type { DataDrivenPropertyValueSpecification } from "maplibre-gl";

/**
 * A shape's look when its style leaves a field unset, as Google draws one: a black line 3 pixels
 * wide, over a black fill at 30%.
 */
export const SHAPE_DEFAULTS = {
  stroke: "#000000",
  strokeOpacity: 1,
  strokeWidth: 3,
  fill: "#000000",
  fillOpacity: 0.3,
} as const;

/** The route's look when its style leaves a field unset: a blue line, wider than a location's. */
export const ROUTE_DEFAULTS = { stroke: "#2563eb", strokeOpacity: 0.85, strokeWidth: 5 } as const;

type LineDefaults = Readonly<Record<"stroke" | "strokeOpacity" | "strokeWidth", string | number>>;

/** A style field from the feature's properties, or `fallback`. */
export function styled<T extends string | number>(
  field: keyof typeof SHAPE_DEFAULTS,
  fallback: string | number = SHAPE_DEFAULTS[field],
): DataDrivenPropertyValueSpecification<T> {
  return ["coalesce", ["get", field], fallback] as never;
}

/**
 * A line's dashes from its `strokeDash`, in line widths, as Google draws them: with the lines'
 * round caps, a dash 2 widths long and a gap of 2, or a dot a width across every 2 widths.
 */
const LINE_DASH = [
  "match",
  ["get", "strokeDash"],
  "dashed",
  ["literal", [1, 3]],
  "dotted",
  ["literal", [0, 2]],
  // A dash with no gap: an empty array draws nothing once the dashes come from the features.
  ["literal", [1, 0]],
] as never;

/**
 * How an area's outline is painted from its feature's style fields, the defaults for the rest:
 * never dashed nor split, so no data-driven dashes on outlines as many as a country's coasts.
 */
export function outlinePaint() {
  return {
    "line-color": styled<string>("stroke"),
    "line-opacity": styled<number>("strokeOpacity"),
    "line-width": styled<number>("strokeWidth"),
  };
}

/**
 * How a line is painted from its feature's style fields, dashes too, `defaults` for those it
 * leaves unset; see-through while its parts draw it (`parted`).
 */
export function linePaint(defaults: LineDefaults = SHAPE_DEFAULTS) {
  return {
    "line-color": styled<string>("stroke", defaults.stroke),
    "line-opacity": [
      "case",
      ["==", ["get", "parted"], true],
      0,
      styled<number>("strokeOpacity", defaults.strokeOpacity),
    ] as never,
    "line-width": styled<number>("strokeWidth", defaults.strokeWidth),
    "line-dasharray": LINE_DASH,
  };
}
