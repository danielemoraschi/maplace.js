/// <reference types="google.maps" preserve="true" />
import type { DrawnStyle } from "../style";

/** Google's own polyline look, which a dashed line's icons take where its style sets nothing. */
export const GOOGLE_LINE = { strokeWidth: 3, strokeOpacity: 1 } as const;

/** A dash: a stroke 2 units long, as wide as the symbol's scale. */
const DASH_PATH = "M 0,-1 0,1";
/** `google.maps.SymbolPath.CIRCLE`, a number, read here without loading Google's core library. */
const CIRCLE_PATH = 0 as google.maps.SymbolPath;

/**
 * The icons drawing a dashed or dotted line along a polyline, over its own stroke made
 * see-through, as Google can't dash a stroke: dashes 2 widths long with a gap of 2, or dots a width
 * across every 2 widths, each in the line's opacity, its colour the polyline's. None for a solid
 * line.
 */
export function dashIcons(style: DrawnStyle | undefined): google.maps.IconSequence[] | undefined {
  const dash = style?.strokeDash;
  if (dash === undefined || dash === "solid") return undefined;
  const width = style?.strokeWidth ?? GOOGLE_LINE.strokeWidth;
  const opacity = style?.strokeOpacity ?? GOOGLE_LINE.strokeOpacity;
  if (dash === "dashed") {
    const icon = { path: DASH_PATH, strokeOpacity: opacity, scale: width };
    return [{ icon, offset: "0", repeat: `${4 * width}px` }];
  }
  const icon = { path: CIRCLE_PATH, fillOpacity: opacity, strokeOpacity: 0, scale: width / 2 };
  return [{ icon, offset: "0", repeat: `${2 * width}px` }];
}
