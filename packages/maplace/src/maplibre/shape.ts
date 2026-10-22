import { anchorOf } from "../adapter-kit/anchor";
import type { Look } from "../adapter-kit/presentation-changes";
import { sameGeometry } from "../adapter-kit/same-geometry";
import { sameStyles, styleInState } from "../adapter-kit/shape-looks";
import { shapeStackRank } from "../adapter-kit/stacking";
import type { Drawable } from "../drawable";
import type { Geometry } from "../geometry";
import { sameState } from "../location-state";
import { editShape, type ShapeEditing } from "./edit-session";
import { shapeFeature, shapeProperties } from "./location-features";
import type { PlacedShape, PlacingSite } from "./placed-location";

/**
 * One circle, polyline or polygon, a feature in the shape layers: drawn in its style for its
 * state, and stacked by its size, the later added in front among one size. A change sends it
 * again only when it changed what is drawn. An editable one shown has handles a user drags.
 */
export function placeShape(drawable: Drawable, site: PlacingSite): PlacedShape {
  const order = site.nextOrder();
  const { shapes } = site.features;
  let drawn = drawable;
  /** The geometry the store has: a drag draws another until the store takes it. */
  let stored = drawable.geometry;
  let look = site.lookOf(drawable.id);
  let rank = shapeStackRank(drawable.geometry, order);
  let editing: ShapeEditing | undefined;
  show({ reshaped: true });
  syncEditing({ reshaped: false });

  /** Draws it as it is now; a change of style alone sends MapLibre its properties only. */
  function show({ reshaped }: { readonly reshaped: boolean }): void {
    const style = styleInState(drawn, look.state);
    if (!look.visible) shapes.remove(drawn.id);
    else if (reshaped || shapes.featureOf(drawn.id) === undefined) {
      shapes.put(shapeFeature(drawn, style, rank));
    } else shapes.restyle(shapeProperties(drawn, style, rank));
  }

  /** Handles while it is editable and shown, moved when the store `reshaped` it. */
  function syncEditing({ reshaped }: { readonly reshaped: boolean }): void {
    // Followed first: a drag cut short by stopping goes back to what the store sent last.
    if (reshaped) editing?.follow(drawn.geometry);
    const wanted = drawn.editable && look.visible;
    if (wanted && editing === undefined) {
      const { mounted, hover } = site;
      editing = editShape(drawn.geometry, { mounted, hover, id: drawn.id, onEdit: showEdit });
    } else if (!wanted && editing !== undefined) {
      editing.stop();
      editing = undefined;
    }
  }

  /** Draws a user's edit at once, restacked by its new size: no diff follows a drag. */
  function showEdit(geometry: Geometry): void {
    drawn = { ...drawn, geometry };
    rank = shapeStackRank(geometry, order);
    show({ reshaped: true });
    void shapes.flush();
  }

  /** Whether `geometry` is a new shape: not the store's copy of an edit, nor what it had before. */
  function isReshape(geometry: Geometry): boolean {
    return ![drawn.geometry, stored].some((now) => sameGeometry(geometry, now));
  }

  return {
    geometryType: drawable.geometry.type as PlacedShape["geometryType"],
    drawable: () => drawn,
    rank: () => rank,
    popupPlace: () => ({ at: anchorOf(drawn.geometry), lift: 0 }),
    editHandles: () => editing?.handles() ?? [],
    update(next) {
      const reshaped = isReshape(next.geometry);
      const restyled = !sameStyles(drawn, next);
      stored = next.geometry;
      drawn = reshaped ? next : { ...next, geometry: drawn.geometry };
      if (reshaped) rank = shapeStackRank(next.geometry, order);
      if (reshaped || restyled) show({ reshaped });
      syncEditing({ reshaped });
    },
    present(next: Look) {
      const changed = !sameState(look.state, next.state) || look.visible !== next.visible;
      look = next;
      if (changed) show({ reshaped: false });
      if (!next.visible) site.hover.gone(drawn.id);
      syncEditing({ reshaped: false });
    },
    remove() {
      editing?.stop();
      shapes.remove(drawn.id);
      site.hover.gone(drawn.id);
    },
  };
}
