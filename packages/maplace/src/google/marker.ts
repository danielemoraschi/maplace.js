/// <reference types="google.maps" preserve="true" />

import { placementOf } from "../adapter-kit/placement";
import type { Look } from "../adapter-kit/presentation-changes";
import { isInFront, stackRank } from "../adapter-kit/stacking";
import type { Drawable } from "../drawable";
import type { MarkerGeometry } from "../geometry";
import type { LocationState } from "../location";
import { sameState } from "../location-state";
import { followMarkerDrags } from "./marker-drags";
import { reportMarkerInput } from "./marker-reports";
import type { PlacedMarker, PlacingSite } from "./placed-location";

/**
 * One advanced marker: clickable and focusable, titled for screen readers, dragged by the user
 * when `editable`, showing the page's icon, else maplace's pin (while selected, or in the page's
 * pin colours) or Google's default pin, its `zIndex` the stacking rank (Google advises one on all
 * markers or none). Each change redoes only what it touches. Where it goes, on the map or into a
 * cluster, is the map's marker layer's to say, from its look.
 */
export function placeMarker(drawable: Drawable, site: PlacingSite): PlacedMarker {
  const order = site.nextOrder();
  let drawn = drawable;
  let look = site.lookOf(drawable.id);
  const marker = newMarker(drawable, site, stackRank(order, look.state));
  const drags = followMarkerDrags(marker, {
    id: drawable.id,
    mounted: site.mounted,
    isEditable: () => drawn.editable,
  });
  const { pins } = site;
  /** This marker's pin, made the first time it shows one and painted for each state after. */
  let pin: HTMLElement | undefined;
  const paintedPin = (state: LocationState) => {
    pin = pins.paint(state, pin);
    return pin;
  };
  const show = (shown: Drawable, state: LocationState) => {
    const { heat } = site.mounted;
    if (shown.heatWeight === undefined || heat === undefined) {
      // A page's icon first: maplace's pin is painted only for a marker showing none.
      showIcon(
        marker,
        shown.renderIcon?.(state) ?? (pins.showsPin(state) ? paintedPin(state) : undefined),
      );
    } else {
      heat.showMarker(marker, shown.heatWeight, isInFront(state) ? paintedPin(state) : undefined);
    }
  };
  show(drawable, look.state);
  const { markers } = site.mounted;
  markers.place(marker, look);

  return {
    marker,
    drawable: () => drawn,
    popupPlace: () => ({ anchor: marker }),
    update(next) {
      // A drag the page cuts short, turning `editable` off, ends where the store has the marker
      // (the RFC's `locationEdit`), wherever Google's dropped drag had left it.
      const editingEnds = drawn.editable && !next.editable;
      const dragCut = editingEnds ? drags.cutShort() : false;
      if (next.geometry !== drawn.geometry || dragCut) {
        marker.position = pointOf(next);
        markers.moved(marker);
      }
      if (next.title !== drawn.title) marker.title = titleOf(next);
      if (next.renderIcon !== drawn.renderIcon || next.heatWeight !== drawn.heatWeight) {
        show(next, look.state);
      }
      if (next.editable !== drawn.editable) marker.gmpDraggable = next.editable;
      drawn = next;
    },
    present(next: Look) {
      if (!sameState(look.state, next.state)) {
        show(drawn, next.state);
        marker.zIndex = stackRank(order, next.state);
      }
      if (placedElsewhere(look, next)) markers.place(marker, next);
      if (!next.visible) site.hover.gone(drawable.id);
      look = next;
    },
    remove() {
      drags.stop();
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
 * The icon for this state, the page's or maplace's pin, as the marker's only child; with none,
 * Google draws its default pin. Children, not `content`, which Maps JS deprecates. An icon already
 * there stays, so a CSS transition on its `data-selected` runs.
 */
function showIcon(marker: HTMLElement, icon: Node | undefined): void {
  if (icon === undefined) marker.replaceChildren();
  else if (!isOnlyChild(marker, icon)) marker.replaceChildren(icon);
}

function isOnlyChild(marker: HTMLElement, icon: Node): boolean {
  return marker.firstChild === icon && marker.childNodes.length === 1;
}
