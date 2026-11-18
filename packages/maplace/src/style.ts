/** How a line's stroke runs: unbroken, in dashes, or in dots. */
export type StrokeDash = "solid" | "dashed" | "dotted";

/** How a line is drawn. Colours are CSS colours, widths are pixels. */
export interface LineStyle {
  readonly stroke?: string | undefined;
  /** 0 to 1. */
  readonly strokeOpacity?: number | undefined;
  readonly strokeWidth?: number | undefined;
  /** `"solid"` when left out; dashes and dots scale with the width. */
  readonly strokeDash?: StrokeDash | undefined;
}

/**
 * How a closed shape (circle, polygon) is drawn: its outline plus a fill. Its outline is solid:
 * Google can't dash one.
 */
export interface ShapeStyle extends Omit<LineStyle, "strokeDash"> {
  readonly fill?: string | undefined;
  /** 0 to 1. */
  readonly fillOpacity?: number | undefined;
}

/** A drawn shape's style: a closed shape's fields, or a line's with its dash. */
export type DrawnStyle = ShapeStyle & LineStyle;

/** Every style field, and whether a line has it or only a closed shape: each named once. */
const STYLE_FIELD_KINDS = {
  stroke: "line",
  strokeOpacity: "line",
  strokeWidth: "line",
  strokeDash: "line",
  fill: "area",
  fillOpacity: "area",
} as const satisfies Record<keyof DrawnStyle, "line" | "area">;

/** Every style field. */
export const DRAWN_STYLE_KEYS = Object.keys(STYLE_FIELD_KINDS) as (keyof DrawnStyle)[];

/** A line style's fields. */
export const LINE_STYLE_KEYS = DRAWN_STYLE_KEYS.filter(
  (key) => STYLE_FIELD_KINDS[key] === "line",
) as (keyof LineStyle)[];
