/// <reference types="google.maps" preserve="true" />
import type { DrawnStyle, LineStyle } from "../style";
import { dashIcons } from "./dash-icons";

/** A shape's style in Google's option names, for `setValues`. */
export interface StyleValues {
  readonly strokeColor: string | undefined;
  readonly strokeOpacity: number | undefined;
  readonly strokeWeight: number | undefined;
  readonly fillColor: string | undefined;
  readonly fillOpacity: number | undefined;
  /** A dashed or dotted line's dashes (`dashIcons`), its own stroke see-through meanwhile. */
  readonly icons: google.maps.IconSequence[] | undefined;
}

/**
 * Every style field in Google's names. One the style leaves out is undefined, which puts the shape
 * back as if it was never set, with Google's default, when a later style drops it.
 */
export function styleValues(style: DrawnStyle | undefined): StyleValues {
  const icons = dashIcons(style);
  return {
    strokeColor: style?.stroke,
    strokeOpacity: icons === undefined ? style?.strokeOpacity : 0,
    strokeWeight: style?.strokeWidth,
    fillColor: style?.fill,
    fillOpacity: style?.fillOpacity,
    icons,
  };
}

/** A line's look from Google's options, in maplace's names: `styleValues` undone for a stroke. */
export function lineStyleFrom(options: google.maps.PolylineOptions): LineStyle {
  return {
    stroke: options.strokeColor ?? undefined,
    strokeOpacity: options.strokeOpacity ?? undefined,
    strokeWidth: options.strokeWeight ?? undefined,
  };
}
