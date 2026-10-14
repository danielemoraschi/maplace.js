import { sameGeometry } from "../adapter-kit/same-geometry";
import type { Geometry } from "../geometry";
import type { GoogleShape } from "./placed-location";
import type { ShapeKind } from "./shape-kinds";

/** The geometry one shape shows, kept in step with the store's and the user's edits. */
export interface ShownGeometry {
  /** Draws `geometry` unless the shape shows it already, as after the store writes back an edit. */
  show(geometry: Geometry): void;
}

interface Showing {
  readonly kind: ShapeKind;
  readonly shape: GoogleShape;
  /** Gets each edit a user makes, as the shape's new geometry. */
  readonly edited: (geometry: Geometry) => void;
}

/**
 * Shows `geometry` on the shape and watches for edits. A draw stops watching while it sets the
 * geometry, since Google fires a user's edit events for maplace's own setters too, and watches
 * again after, since setting a path replaces the arrays watched. Only a geometry that differs from
 * what the shape shows is drawn or reported: the store writes back a copy of each edit, and
 * redrawing it would replace the arrays the user is editing (0.2 lost edits that way, #64 and
 * #178); an edit that leaves the shape as it was reports nothing.
 */
export function showGeometry(geometry: Geometry, { kind, shape, edited }: Showing): ShownGeometry {
  let shown = geometry;
  let stopWatching = () => {};

  function draw(next: Geometry): void {
    stopWatching();
    kind.show(shape, next);
    shown = kind.read(shape);
    stopWatching = kind.watch(shape, reportEdit);
  }

  function reportEdit(): void {
    const read = kind.read(shape);
    if (sameGeometry(read, shown)) return;
    shown = read;
    edited(read);
  }

  draw(geometry);
  return {
    show(next) {
      if (!sameGeometry(next, shown)) draw(next);
    },
  };
}
