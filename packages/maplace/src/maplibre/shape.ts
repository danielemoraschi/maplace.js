import { drawableParts } from "../adapter-kit/line-parts";
import type { Look } from "../adapter-kit/presentation-changes";
import { sameGeometry } from "../adapter-kit/same-geometry";
import { sameLooks, styleInState } from "../adapter-kit/shape-looks";
import { frontRank, shapeStackRank } from "../adapter-kit/stacking";
import { anchorOf } from "../anchor";
import type { Drawable } from "../drawable";
import type { Geometry } from "../geometry";
import { sameState } from "../location-state";
import { editShape, type ShapeEditing } from "./edit-session";
import { SHAPE_DEFAULTS } from "./line-paint";
import { PART_LIFT, putParts, removeParts } from "./line-parts";
import { shapeFeature, shapeKeys, shapeProperties } from "./location-features";
import type { PlacedShape, PlacingSite } from "./placed-location";

/**
 * One circle, polyline, polygon or multipolygon, a feature in the shape layers: drawn in its style
 * for its state, and stacked by its size, the later added in front among one size. A change sends it
 * again only when it changed what is drawn. An editable one shown has handles a user drags.
 */
export function placeShape(drawable: Drawable, site: PlacingSite): PlacedShape {
  const order = site.nextOrder();
  const { shapes } = site.features;
  let drawn = drawable;
  /** The geometry the store has: a drag under way draws another. */
  let stored = drawable.geometry;
  let look = site.lookOf(drawable.id);
  let rank = shapeStackRank(drawable.geometry, order);
  let editing: ShapeEditing | undefined;
  show({ reshaped: true });
  syncEditing({ reshaped: false });

  /**
   * Draws it as it is now, its outline lifted while hovered or selected; a change of style alone
   * sends MapLibre its properties only.
   */
  function show({ reshaped }: { readonly reshaped: boolean }): void {
    const { state } = look;
    const strokeRank = frontRank(state) ?? rank;
    const style = styleInState(drawn, state);
    const parts = look.visible
      ? drawableParts(drawn, style, SHAPE_DEFAULTS.strokeOpacity)
      : undefined;
    const drawing = { style, rank, strokeRank, parted: parts !== undefined };
    const keys = shapeKeys(drawn.id);
    if (!look.visible) shapes.remove(keys.own);
    else if (reshaped || shapes.featureOf(keys.own) === undefined) {
      shapes.put(shapeFeature(drawn, drawing));
    } else shapes.restyle(shapeProperties(drawn, drawing));
    if (parts === undefined) removeParts(shapes, keys);
    else putParts(shapes, keys, parts, { id: drawn.id, rank, strokeRank: strokeRank + PART_LIFT });
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

  /**
   * Whether `geometry` is drawn anew: not the store's copy of an edit, nor, while a drag is under
   * way, what the store had before it. Once no drag is, the store's geometry is drawn again, as
   * Google's is, though the page never took the edit.
   */
  function isReshape(geometry: Geometry): boolean {
    if (sameGeometry(geometry, drawn.geometry)) return false;
    return !(editing?.isDragging() === true && sameGeometry(geometry, stored));
  }

  return {
    geometryType: drawable.geometry.type as PlacedShape["geometryType"],
    drawable: () => drawn,
    rank: () => rank,
    popupPlace: () => ({ at: anchorOf(drawn.geometry), lift: 0 }),
    editHandles: () => editing?.handles() ?? [],
    update(next) {
      const reshaped = isReshape(next.geometry);
      const restyled = !sameLooks(drawn, next);
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
      const keys = shapeKeys(drawn.id);
      shapes.remove(keys.own);
      removeParts(shapes, keys);
      site.hover.gone(drawn.id);
    },
  };
}
