import type { Look } from "../adapter-kit/presentation-changes";
import { stackRank } from "../adapter-kit/stacking";
import type { Drawable } from "../drawable";
import type { MarkerGeometry } from "../geometry";
import type { LocationState } from "../location";
import { sameState } from "../location-state";
import { createDomMarker, type DomMarker } from "./dom-marker";
import { pinFeature } from "./location-features";
import { PIN_SIZE } from "./pin-image";
import type { PlacedMarker, PlacingSite } from "./placed-location";

/**
 * One marker: a pin in the pin layer, or, while the page's icon builds something for its state, a
 * DOM marker showing it. The icon is built when placed, when its state changes and when the page
 * gives a new builder, never for a change of visibility. A pin stays in the layer of every pin in
 * the order added; selected or hovered, it is drawn again in front of them all (`FrontPins`), so
 * selecting or hovering never lays out the layer again. Each change redoes only what it touches.
 */
export function placeMarker(drawable: Drawable, site: PlacingSite): PlacedMarker {
  const order = site.nextOrder();
  const { pins } = site.features;
  const { frontPins } = site;
  const { id } = drawable;
  let drawn = drawable;
  let look = site.lookOf(id);
  let icon = drawable.renderIcon?.(look.state);
  let dom: DomMarker | undefined;
  const rank = () => stackRank(order, look.state);
  show({ moved: true });

  /** Shows the marker as it is now: as its icon, else as a pin; hidden, as neither. */
  function show({ moved }: { readonly moved: boolean }): void {
    if (icon === undefined) showPin(moved);
    else showIcon(icon);
  }

  function showPin(moved: boolean): void {
    dom?.remove();
    dom = undefined;
    if (!look.visible) {
      pins.remove(id);
      frontPins.hide(id);
      return;
    }
    if (moved || pins.featureOf(id) === undefined) pins.put(pinFeature(drawn, order));
    if (isInFront(look.state)) frontPins.show(id, pointOf(drawn), rank());
    else frontPins.hide(id);
  }

  function showIcon(built: Node): void {
    pins.remove(id);
    frontPins.hide(id);
    if (dom === undefined)
      dom = createDomMarker(drawn, pointOf(drawn), site, { rank: rank(), icon: built });
    else {
      dom.showIcon(built);
      dom.restack(rank());
    }
    dom.setVisible(look.visible);
  }

  return {
    geometryType: "marker",
    drawable: () => drawn,
    domMarker: () => dom?.marker,
    isInDom: () => dom !== undefined || frontPins.isShown(id),
    rank,
    popupPlace: () => ({ at: pointOf(drawn), lift: dom?.height() ?? PIN_SIZE.height }),
    update(next) {
      const moved = next.geometry !== drawn.geometry;
      const newBuilder = next.renderIcon !== drawn.renderIcon;
      if (next.title !== drawn.title) dom?.retitle(next.title);
      drawn = next;
      if (newBuilder) icon = next.renderIcon?.(look.state);
      if (moved && dom !== undefined) dom.moveTo(pointOf(next));
      if (newBuilder || (moved && dom === undefined)) show({ moved });
    },
    present(next: Look) {
      const stateChanged = !sameState(look.state, next.state);
      look = next;
      if (stateChanged) icon = drawn.renderIcon?.(next.state);
      show({ moved: false });
      if (!next.visible) site.hover.gone(id);
    },
    remove() {
      dom?.remove();
      pins.remove(id);
      frontPins.hide(id);
      site.hover.gone(id);
    },
  };
}

/** Drawn in front of the other pins: what the user points at or chose. */
function isInFront(state: LocationState): boolean {
  return state.selected || state.hovered;
}

/** A marker's drawable always has a marker's geometry: a type change removes and adds it. */
function pointOf(drawable: Drawable): MarkerGeometry {
  return drawable.geometry as MarkerGeometry;
}
