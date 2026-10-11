/** How a line is drawn. Colours are CSS colours, widths are pixels. */
export interface LineStyle {
  readonly stroke?: string | undefined;
  /** 0 to 1. */
  readonly strokeOpacity?: number | undefined;
  readonly strokeWidth?: number | undefined;
}

/** How a closed shape (circle, polygon) is drawn: its outline plus a fill. */
export interface ShapeStyle extends LineStyle {
  readonly fill?: string | undefined;
  /** 0 to 1. */
  readonly fillOpacity?: number | undefined;
}
