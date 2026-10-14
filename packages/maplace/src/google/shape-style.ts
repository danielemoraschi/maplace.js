import type { ShapeStyle } from "../style";

/** A shape's style in Google's option names, for `setValues`. */
interface StyleValues {
  readonly strokeColor: string | undefined;
  readonly strokeOpacity: number | undefined;
  readonly strokeWeight: number | undefined;
  readonly fillColor: string | undefined;
  readonly fillOpacity: number | undefined;
}

/**
 * Every style field in Google's names. One the style leaves out is undefined, which puts the shape
 * back as if it was never set, with Google's default, when a later style drops it.
 */
export function styleValues(style: ShapeStyle | undefined): StyleValues {
  return {
    strokeColor: style?.stroke,
    strokeOpacity: style?.strokeOpacity,
    strokeWeight: style?.strokeWidth,
    fillColor: style?.fill,
    fillOpacity: style?.fillOpacity,
  };
}
