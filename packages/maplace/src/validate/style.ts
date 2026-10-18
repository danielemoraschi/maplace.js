import type { StyleField } from "../drawable";
import type { LineStyle, ShapeStyle } from "../style";
import { type Assert, recordOf } from "./record";
import { type Check, checkNonEmptyString, NON_NEGATIVE, numberIn, optional } from "./values";

const colour = optional(checkNonEmptyString);
const opacity = optional(numberIn({ min: 0, max: 1 }));
const width = optional(numberIn(NON_NEGATIVE));
const NO_FILL = "is not a line style field; a line has no fill";

const LINE_CHECKS = { stroke: colour, strokeOpacity: opacity, strokeWidth: width };

export const checkLineStyle: Assert<LineStyle> = recordOf<LineStyle>({
  checks: LINE_CHECKS,
  unknown: "is not a line style field",
  remarks: { fill: NO_FILL, fillOpacity: NO_FILL },
});

export const checkShapeStyle: Assert<ShapeStyle> = recordOf<ShapeStyle>({
  checks: { ...LINE_CHECKS, fill: colour, fillOpacity: opacity },
  unknown: "is not a style field",
});

/** A shape's style at rest and in each state, each optional and checked by `check`. */
export function shapeStyleChecks(check: Check): Readonly<Record<StyleField, Check>> {
  const style = optional(check);
  return { style, selectedStyle: style, hoveredStyle: style };
}
