import type { Look } from "../adapter-kit/presentation-changes";
import { stackRank } from "../adapter-kit/stacking";
import type { Drawable } from "../drawable";
import type { MarkerGeometry } from "../geometry";
import type { LocationState } from "../location";
import { sameState } from "../location-state";
import type { ClusterMember } from "./clustering";
import { createDomMarker, createPinIcon, type DomMarker } from "./dom-marker";
import { pinFeature } from "./location-features";
import { PIN_SIZE } from "./pin-image";
import type { PlacedMarker, PlacingSite } from "./placed-location";

/**
 * One marker: a pin in the pin layer, or, while the page's icon builds something for its state, a
 * DOM marker showing it; an editable one shows the pin in a DOM marker, which the user drags. The
 * icon is built when placed, when its state changes, when the page gives a new builder and when
 * `editable` changes, never for a change of visibility. A pin stays in the layer of every pin in
 * the order added; selected or hovered, it is drawn again in front of them all (`FrontPins`), so
 * selecting or hovering never lays out the layer again. Folded into a cluster (`ClusterMember`),
 * it draws nothing, as when hidden. Each change redoes only what it touches.
 */
export function placeMarker(drawable: Drawable, site: PlacingSite): PlacedMarker {
  const order = site.nextOrder();
  const { pins } = site.features;
  const { frontPins } = site;
  const { clustering } = site.mounted;
  const { id } = drawable;
  let drawn = drawable;
  let look = site.lookOf(id);
  let pinIcon: HTMLElement | undefined;
  let icon = iconFor(drawable, look.state);
  let dom: DomMarker | undefined;
  let folded = false;
  const rank = () => stackRank(order, look.state);
  const member: ClusterMember = { id, at: () => pointOf(drawn), fold, unfold };
  clustering.place(member, look);
  // Folded at once: folding it already drew it, as nothing.
  if (!folded) show({ moved: true });

  /**
   * What the marker shows in the DOM: the page's icon; else, while it can be dragged, the pin, as
   * only a DOM marker drags; else nothing, a pin in the pin layer.
   */
  function iconFor(shown: Drawable, state: LocationState): Node | undefined {
    const pageIcon = shown.renderIcon?.(state);
    if (pageIcon !== undefined || !shown.editable) return pageIcon;
    pinIcon ??= createPinIcon(site.mounted.map.getContainer().ownerDocument);
    return pinIcon;
  }

  /**
   * Whether `next` changes what the marker shows: a new builder does; so does `editable` changing,
   * unless the page's icon is shown, which stays (its node and CSS transition), only dragged or not.
   */
  function changesIcon(next: Drawable): boolean {
    if (next.renderIcon !== drawn.renderIcon) return true;
    const showsPageIcon = icon !== undefined && icon !== pinIcon;
    return next.editable !== drawn.editable && !showsPageIcon;
  }

  /** Seen on the map: not hidden, nor folded into a cluster. */
  function isDrawn(): boolean {
    return look.visible && !folded;
  }

  function fold(): boolean {
    if (folded) return false;
    folded = true;
    show({ moved: false });
    site.hover.gone(id);
    return true;
  }

  function unfold(): boolean {
    if (!folded) return false;
    folded = false;
    show({ moved: false });
    return true;
  }

  /** Shows the marker as it is now: as its icon, else as a pin; hidden or folded, as neither. */
  function show({ moved }: { readonly moved: boolean }): void {
    if (icon === undefined) showPin(moved);
    else showIcon(icon);
  }

  function showPin(moved: boolean): void {
    dom?.remove();
    dom = undefined;
    if (!isDrawn()) {
      hidePin();
      return;
    }
    if (moved || pins.featureOf(id) === undefined) pins.put(pinFeature(drawn, order));
    if (isInFront(look.state)) frontPins.show(id, pointOf(drawn), rank());
    else frontPins.hide(id);
  }

  /** Shows the icon in its DOM marker, made the first time it is drawn: none for one never seen. */
  function showIcon(built: Node): void {
    hidePin();
    if (dom === undefined) {
      if (!isDrawn()) return;
      const draggable = drawn.editable;
      dom = createDomMarker(drawn, pointOf(drawn), site, { rank: rank(), icon: built, draggable });
    } else {
      dom.showIcon(built);
      dom.restack(rank());
    }
    dom.setVisible(isDrawn());
  }

  /** Takes its pin out of the pin layer, and from in front of it. */
  function hidePin(): void {
    pins.remove(id);
    frontPins.hide(id);
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
      const newIcon = changesIcon(next);
      if (next.title !== drawn.title) dom?.retitle(next.title);
      const editableChanged = next.editable !== drawn.editable;
      drawn = next;
      if (newIcon) icon = iconFor(next, look.state);
      if (moved) {
        dom?.moveTo(pointOf(next));
        clustering.moved(member);
      }
      if (newIcon || (moved && dom === undefined)) show({ moved });
      // After `show`: a DOM marker drawn as a pin again is taken off there, its drag ending with
      // it; only one that stays, showing the page's icon, has its drag cut short.
      if (editableChanged) dom?.setDraggable(next.editable);
    },
    present(next: Look) {
      const stateChanged = !sameState(look.state, next.state);
      look = next;
      if (stateChanged) icon = iconFor(drawn, next.state);
      clustering.place(member, next);
      show({ moved: false });
      if (!next.visible) site.hover.gone(id);
    },
    remove() {
      clustering.remove(member);
      dom?.remove();
      hidePin();
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
