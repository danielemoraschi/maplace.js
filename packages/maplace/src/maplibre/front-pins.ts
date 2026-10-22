import type { Marker } from "maplibre-gl";
import type { LatLng } from "../geometry";
import { lngLatOf } from "./conversions";
import { createPinIcon } from "./dom-marker";
import type { MountedMapLibre } from "./mounted-map";

/**
 * The selected and hovered pins, drawn again in the DOM over the pin layer: they stack above every
 * other pin, as Google's do, while the layer of every pin stays as it is. Changing a source or a
 * feature's state makes MapLibre lay out every pin again (80 ms for 4,000 in headless Chromium,
 * over the RFC's 50 ms for a selection); moving an element costs nothing. They only show: the pin
 * under each in the layer still takes the pointer, so clicks and hover stay one path.
 */
export interface FrontPins {
  /** Shows `id`'s pin in front at `at`, stacked by `rank`; again, it only moves and restacks. */
  show(id: string, at: LatLng, rank: number): void;
  hide(id: string): void;
  isShown(id: string): boolean;
}

/** The map's front pins: a marker each while shown, kept for the next one once hidden. */
export function createFrontPins({ map, maplibre }: MountedMapLibre): FrontPins {
  const shown = new Map<string, Marker>();
  const spare: Marker[] = [];
  const document = map.getContainer().ownerDocument;
  const newMarker = () => new maplibre.Marker({ element: pinElement(document), anchor: "bottom" });

  return {
    show(id, at, rank) {
      const known = shown.get(id);
      const marker = known ?? spare.pop() ?? newMarker();
      marker.setLngLat(lngLatOf(at));
      marker.getElement().style.zIndex = String(rank);
      if (known === undefined) {
        marker.addTo(map);
        shown.set(id, marker);
      }
    },
    hide(id) {
      const marker = shown.get(id);
      if (marker === undefined) return;
      marker.remove();
      shown.delete(id);
      spare.push(marker);
    },
    isShown: (id) => shown.has(id),
  };
}

/** The pin's image, letting the pointer through to the pin under it in the layer. */
function pinElement(document: Document): HTMLElement {
  const image = createPinIcon(document);
  image.style.pointerEvents = "none";
  return image;
}
