/// <reference types="google.maps" preserve="true" />

import { editReportsFor } from "../adapter-kit/edit-reports";
import type { Look } from "../adapter-kit/presentation-changes";
import { showsEditHandles } from "../adapter-kit/shape-looks";
import { shapeStackRank } from "../adapter-kit/stacking";
import { anchorOf } from "../anchor";
import type { Drawable } from "../drawable";
import { cutOnBlur, type GiveBack, takeEditingAway } from "./blur-cuts";
import { liftedOutline } from "./lifted-outline";
import { googleLineParts } from "./line-parts";
import { sameShownStyle, shownStyleValues } from "./own-stroke";
import type { GoogleShape, PlacedShape, PlacingSite } from "./placed-location";
import { showGeometry } from "./shape-geometry";
import { type ShapeHandles, shapeHandles } from "./shape-handles";
import {
  CIRCLE,
  MULTIPOLYGON,
  POLYGON,
  POLYLINE,
  type ShapeKind,
  type ShapeType,
} from "./shape-kinds";
import { reportShapeInput } from "./shape-reports";

type ShapePlacer = (drawable: Drawable, site: PlacingSite) => PlacedShape;

/** A placer for every shape type, so a type left out fails to compile. */
export const SHAPE_PLACERS: Readonly<Record<ShapeType, ShapePlacer>> = {
  circle: shapePlacer(CIRCLE),
  polyline: shapePlacer(POLYLINE),
  polygon: shapePlacer(POLYGON),
  multipolygon: shapePlacer(MULTIPOLYGON),
};

/**
 * One circle, polyline, polygon or multipolygon: clickable, styled in its state's look, reshaped
 * by the user when `editable` (its handles shown while hovered or selected), its `zIndex` its rank
 * among shapes by size (Google draws every marker above every shape), its outline drawn again over
 * the others while hovered or selected.
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
    const handles = shapeHandles(
      shape,
      (held) => showsEditHandles(drawn, look, held),
      site.mounted,
    );
    const outline = liftedOutline(kind, site.mounted);
    const parts = googleLineParts(site.mounted);
    const lift = () => {
      outline.draw(drawn, look);
      parts.draw(drawn, look, shapeStackRank(drawn.geometry, order));
    };
    lift();
    const stopCutting = cutOnBlur(site.mounted, () => cutHandleDrag(shape, handles));

    return {
      shape,
      seenStroke: () => outline.copy() ?? parts.shown(),
      drawable: () => drawn,
      popupPlace: () => ({ position: anchorOf(drawn.geometry) }),
      update(next) {
        if (next.geometry !== drawn.geometry) {
          geometry.show(next.geometry);
          shape.setValues({ zIndex: shapeStackRank(next.geometry, order) });
        }
        if (!sameShownStyle([drawn, look], [next, look])) {
          shape.setValues(shownStyleValues(next, look));
        }
        drawn = next;
        handles.sync();
        lift();
      },
      present(next: Look) {
        if (!sameShownStyle([drawn, look], [drawn, next])) {
          shape.setValues(shownStyleValues(drawn, next));
        }
        if (next.visible !== look.visible) shape.setValues({ visible: next.visible });
        if (!next.visible) site.hover.gone(id);
        look = next;
        handles.sync();
        lift();
      },
      remove() {
        stopCutting();
        handles.stop();
        outline.remove();
        parts.remove();
        geometry.stop();
        shape.setMap(null);
        site.hover.gone(id);
      },
    };
  };
}

/**
 * Cuts short a handle's drag the window's blur leaves held: Google says where a handle went only
 * once let go, which may be anywhere or never, so it can't end where it was (the RFC's
 * `locationEdit`). Editing off drops it, reporting nothing, the shape as the store has it.
 */
function cutHandleDrag(shape: GoogleShape, handles: ShapeHandles): GiveBack | undefined {
  return takeEditingAway((on) => shape.setValues({ editable: on }), handles.shown);
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
    ...shownStyleValues(drawable, look),
    zIndex: shapeStackRank(drawable.geometry, order),
    clickable: true,
    // Its handles come from `shapeHandles`, once it knows the shape's look.
    editable: false,
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
