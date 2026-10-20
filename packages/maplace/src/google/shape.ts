/// <reference types="google.maps" preserve="true" />
import { anchorOf } from "../adapter-kit/anchor";
import { editReportsFor } from "../adapter-kit/edit-reports";
import { sameStyles, styleInState } from "../adapter-kit/shape-looks";
import { shapeStackRank } from "../adapter-kit/stacking";
import type { Drawable } from "../drawable";
import { sameState } from "../location-state";
import type { Look, PlacedShape, PlacingSite } from "./placed-location";
import { showGeometry } from "./shape-geometry";
import { CIRCLE, POLYGON, POLYLINE, type ShapeKind, type ShapeType } from "./shape-kinds";
import { reportShapeInput } from "./shape-reports";
import { styleValues } from "./shape-style";

type ShapePlacer = (drawable: Drawable, site: PlacingSite) => PlacedShape;

/** A placer for every shape type, so a type left out fails to compile. */
export const SHAPE_PLACERS: Readonly<Record<ShapeType, ShapePlacer>> = {
  circle: shapePlacer(CIRCLE),
  polyline: shapePlacer(POLYLINE),
  polygon: shapePlacer(POLYGON),
};

/**
 * One circle, polyline or polygon: clickable, styled in its state's look, reshaped by the user
 * when `editable`, its `zIndex` its rank among shapes by size (Google draws every marker above
 * every shape).
 * Each change redoes only what it touches; an edit is reported once, when the user lets go.
 */
function shapePlacer(kind: ShapeKind): ShapePlacer {
  return (drawable, site) => {
    // The closures keep the id, not the first drawable and its geometry.
    const { id } = drawable;
    const order = site.nextOrder();
    let drawn = drawable;
    let look = site.lookOf(id);
    const { shape, geometry } = newShape(kind, { drawable, site, look, order });

    return {
      shape,
      drawable: () => drawn,
      popupPlace: () => ({ position: anchorOf(drawn.geometry) }),
      update(next) {
        if (next.geometry !== drawn.geometry) {
          geometry.show(next.geometry);
          shape.setValues({ zIndex: shapeStackRank(next.geometry, order) });
        }
        if (!sameStyles(next, drawn)) {
          shape.setValues(styleValues(styleInState(next, look.state)));
        }
        if (next.editable !== drawn.editable) shape.setValues({ editable: next.editable });
        drawn = next;
      },
      present(next: Look) {
        if (!sameState(look.state, next.state)) {
          shape.setValues(styleValues(styleInState(drawn, next.state)));
        }
        if (next.visible !== look.visible) shape.setValues({ visible: next.visible });
        if (!next.visible) site.hover.gone(id);
        look = next;
      },
      remove() {
        shape.setMap(null);
        site.hover.gone(id);
      },
    };
  };
}

/** What a new shape shows, where, and how it starts: its look and its place in the order. */
interface Placing {
  readonly drawable: Drawable;
  readonly site: PlacingSite;
  readonly look: Look;
  readonly order: number;
}

/** A clickable shape on the map showing the drawable, reporting its input while the map is live. */
function newShape(kind: ShapeKind, { drawable, site, look, order }: Placing) {
  const shape = kind.create(site.mounted.libraries.maps);
  shape.setValues({
    ...styleValues(styleInState(drawable, look.state)),
    zIndex: shapeStackRank(drawable.geometry, order),
    clickable: true,
    editable: drawable.editable,
    visible: look.visible,
  });
  const { id } = drawable;
  const geometry = showGeometry(drawable.geometry, {
    kind,
    shape,
    edited: editReportsFor(id, site.mounted.live).ended,
  });
  reportShapeInput(shape, id, site);
  shape.setMap(site.mounted.map);
  return { shape, geometry };
}
