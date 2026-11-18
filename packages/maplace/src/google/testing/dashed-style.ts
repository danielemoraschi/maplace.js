/// <reference types="google.maps" />
import type { LineStyle } from "../../style";
import type { GoogleShape } from "../placed-location";

/**
 * A line's dash and opacity as a user sees them, read from the icons Google draws along it: a
 * stroke's for dashes, a filled circle's for dots. Nothing when no icons draw it: a solid line,
 * whose stroke is read as it is.
 */
export function dashedStyleOf(shape: GoogleShape): LineStyle {
  const [sequence] = (shape.get("icons") as google.maps.IconSequence[] | undefined) ?? [];
  const icon = sequence?.icon;
  if (icon == null) return {};
  return typeof icon.path === "string"
    ? { strokeDash: "dashed", strokeOpacity: icon.strokeOpacity ?? undefined }
    : { strokeDash: "dotted", strokeOpacity: icon.fillOpacity ?? undefined };
}
