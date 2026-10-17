import type { GoogleShape, PlacingSite } from "./placed-location";

/**
 * Reports one shape's clicks, and the pointer on it, while the map is live. Shapes aren't
 * focusable on Google: the list view is their keyboard path. The listeners go with the shape.
 */
export function reportShapeInput(
  shape: GoogleShape,
  id: string,
  { mounted, hover }: PlacingSite,
): void {
  shape.addListener("click", () => mounted.live()?.reportSelectionChange(id));
  shape.addListener("mouseover", () => hover.enter("pointer", id));
  shape.addListener("mouseout", () => hover.leave("pointer", id));
}
