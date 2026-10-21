import { anchorOf } from "../adapter-kit/anchor";
import type { Look } from "../adapter-kit/presentation-changes";
import { sameStyles, styleInState } from "../adapter-kit/shape-looks";
import { shapeStackRank } from "../adapter-kit/stacking";
import type { Drawable } from "../drawable";
import { sameState } from "../location-state";
import { shapeFeature, shapeProperties } from "./location-features";
import type { PlacedShape, PlacingSite } from "./placed-location";

/**
 * One polyline or polygon, a feature in the shape layers: drawn in its style for its state, and
 * stacked by its size, the later added in front among one size. A change sends it again only
 * when it changed what is drawn.
 */
export function placeShape(drawable: Drawable, site: PlacingSite): PlacedShape {
  const order = site.nextOrder();
  const { shapes } = site.features;
  let drawn = drawable;
  let look = site.lookOf(drawable.id);
  let rank = shapeStackRank(drawable.geometry, order);
  show({ reshaped: true });

  /** Draws it as it is now; a change of style alone sends MapLibre its properties only. */
  function show({ reshaped }: { readonly reshaped: boolean }): void {
    const style = styleInState(drawn, look.state);
    if (!look.visible) shapes.remove(drawn.id);
    else if (reshaped || shapes.featureOf(drawn.id) === undefined) {
      shapes.put(shapeFeature(drawn, style, rank));
    } else shapes.restyle(shapeProperties(drawn, style, rank));
  }

  return {
    geometryType: drawable.geometry.type as PlacedShape["geometryType"],
    drawable: () => drawn,
    rank: () => rank,
    popupPlace: () => ({ at: anchorOf(drawn.geometry), lift: 0 }),
    update(next) {
      const reshaped = next.geometry !== drawn.geometry;
      const restyled = !sameStyles(drawn, next);
      drawn = next;
      if (reshaped) rank = shapeStackRank(next.geometry, order);
      if (reshaped || restyled) show({ reshaped });
    },
    present(next: Look) {
      const changed = !sameState(look.state, next.state) || look.visible !== next.visible;
      look = next;
      if (changed) show({ reshaped: false });
      if (!next.visible) site.hover.gone(drawn.id);
    },
    remove() {
      shapes.remove(drawn.id);
      site.hover.gone(drawn.id);
    },
  };
}
