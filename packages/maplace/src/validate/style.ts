import type { StyleField } from "../drawable";
import type { LineStyle, ShapeStyle, StrokeDash } from "../style";
import { type Assert, recordOf } from "./record";
import {
  type Check,
  checkNonEmptyString,
  FRACTION,
  members,
  NON_NEGATIVE,
  numberIn,
  oneOf,
  optional,
} from "./values";

const STROKE_DASHES = members<StrokeDash>({ solid: true, dashed: true, dotted: true });

const colour = optional(checkNonEmptyString);
const opacity = optional(numberIn(FRACTION));
const width = optional(numberIn(NON_NEGATIVE));
const NO_FILL = "is not a line style field; a line has no fill";

const OUTLINE_CHECKS = { stroke: colour, strokeOpacity: opacity, strokeWidth: width };
const SHAPE_CHECKS = { ...OUTLINE_CHECKS, fill: colour, fillOpacity: opacity };

export const checkLineStyle: Assert<LineStyle> = recordOf<LineStyle>({
  checks: { ...OUTLINE_CHECKS, strokeDash: optional(oneOf(STROKE_DASHES)) },
  unknown: "is not a line style field",
  remarks: { fill: NO_FILL, fillOpacity: NO_FILL },
});

export const checkShapeStyle = closedShapeStyle(
  "is a line's: a circle's or polygon's outline is solid",
);

/** The store's default styles, which lines and areas are drawn with alike: no dash. */
export const checkDefaultStyle = closedShapeStyle(
  "goes on a line's own style or the route's: the store's default styles also draw areas",
);

/** A closed shape's style; a `strokeDash` is refused with `dashRemark`. */
function closedShapeStyle(dashRemark: string): Assert<ShapeStyle> {
  return recordOf<ShapeStyle>({
    checks: SHAPE_CHECKS,
    unknown: "is not a style field",
    remarks: { strokeDash: dashRemark },
  });
}

/** A shape's style at rest and in each state, each optional and checked by `check`. */
export function shapeStyleChecks(check: Check): Readonly<Record<StyleField, Check>> {
  const style = optional(check);
  return { style, selectedStyle: style, hoveredStyle: style, activeStyle: style };
}
