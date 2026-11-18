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

/** How a line is painted from its feature's style fields, `defaults` for those it leaves unset. */
export function linePaint(defaults: LineDefaults = SHAPE_DEFAULTS) {
  return {
    "line-color": styled<string>("stroke", defaults.stroke),
    "line-opacity": styled<number>("strokeOpacity", defaults.strokeOpacity),
    "line-width": styled<number>("strokeWidth", defaults.strokeWidth),
  };
}
