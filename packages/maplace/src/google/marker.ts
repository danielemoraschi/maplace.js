/// <reference types="google.maps" preserve="true" />

import { placementOf } from "../adapter-kit/placement";
import { stackRank } from "../adapter-kit/stacking";
import type { Drawable } from "../drawable";
import type { MarkerGeometry } from "../geometry";
import type { LocationState } from "../location";
import { sameState } from "../location-state";
import { reportMarkerInput } from "./marker-reports";
import type { Look, PlacedMarker, PlacingSite } from "./placed-location";

/**
 * One advanced marker: clickable and focusable, titled for screen readers, dragged by the user
 * when `editable`, showing the page's icon or Google's default pin, its `zIndex` the stacking
 * rank (Google advises one on all markers or none). Each change redoes only what it touches. Where
 * it goes, on the map or into a cluster, is the map's marker layer's to say, from its look.
 */
export function placeMarker(drawable: Drawable, site: PlacingSite): PlacedMarker {
  const order = site.nextOrder();
  let drawn = drawable;
  let look = site.lookOf(drawable.id);
  const marker = newMarker(drawable, site, stackRank(order, look.state));
  showIcon(marker, drawable, look.state);
  const { markers } = site.mounted;
  markers.place(marker, look);

  return {
    marker,
    drawable: () => drawn,
    popupPlace: () => ({ anchor: marker }),
    update(next) {
      if (next.geometry !== drawn.geometry) {
        marker.position = pointOf(next);
        markers.moved(marker);
      }
      if (next.title !== drawn.title) marker.title = titleOf(next);
      if (next.renderIcon !== drawn.renderIcon) showIcon(marker, next, look.state);
      if (next.editable !== drawn.editable) marker.gmpDraggable = next.editable;
      drawn = next;
    },
    present(next: Look) {
      if (!sameState(look.state, next.state)) {
        showIcon(marker, drawn, next.state);
        marker.zIndex = stackRank(order, next.state);
      }
      if (placedElsewhere(look, next)) markers.place(marker, next);
      if (!next.visible) site.hover.gone(drawable.id);
      look = next;
    },
    remove() {
      markers.remove(marker);
      site.hover.gone(drawable.id);
    },
  };
}

/** Whether a new look moves the marker: shown or not, in a cluster or standing alone. */
function placedElsewhere(look: Look, next: Look): boolean {
  return placementOf(look.visible, look.state) !== placementOf(next.visible, next.state);
}

/** A clickable, titled marker where the drawable is, reporting its input while the map is live. */
function newMarker(drawable: Drawable, site: PlacingSite, zIndex: number): PlacedMarker["marker"] {
  const { AdvancedMarkerElement } = site.mounted.libraries.marker;
  const marker = new AdvancedMarkerElement({
    position: pointOf(drawable),
    title: titleOf(drawable),
    gmpClickable: true,
    gmpDraggable: drawable.editable,
    zIndex,
  });
  reportMarkerInput(marker, drawable.id, site);
  return marker;
}

/** A marker's drawable always has a marker's geometry: a type change removes and adds it. */
function pointOf(drawable: Drawable): google.maps.LatLngLiteral {
  const { lat, lng } = drawable.geometry as MarkerGeometry;
  return { lat, lng };
}

function titleOf(drawable: Drawable): string {
  return drawable.title ?? "";
}

/**
 * The page's icon for this state, as the marker's only child; with none, Google draws its
 * default pin. Children, not `content`, which Maps JS deprecates.
 */
function showIcon(marker: HTMLElement, drawable: Drawable, state: LocationState): void {
  const icon = drawable.renderIcon?.(state);
  if (icon) marker.replaceChildren(icon);
  else marker.replaceChildren();
}
