import { isTouch } from "../adapter-kit/hover-reports";
import { reportLocationClick } from "./map-clicks";
import type { GoogleShape, PlacingSite } from "./placed-location";

/**
 * Reports one shape's clicks, and the pointer on it, while the map is live. Shapes aren't
 * focusable on Google: the list view is their keyboard path. The listeners go with the shape. A
 * touch hovers nothing, as on a marker: Google sends a tap's `mouseover` with no `mouseout`, so it
 * lets go of what the pointer hovered instead.
 */
export function reportShapeInput(
  shape: GoogleShape,
  id: string,
  { mounted, hover }: PlacingSite,
): void {
  shape.addListener("click", () => reportLocationClick(mounted, id));
  shape.addListener("mouseover", (event?: google.maps.MapMouseEvent) => {
    if (isTouch(event?.domEvent)) hover.letGo("pointer");
    else hover.enter("pointer", id);
  });
  shape.addListener("mouseout", () => hover.leave("pointer", id));
}
