import type { Marker } from "maplibre-gl";
import { type PinColours, type PinPalette, pinColoursIn } from "../adapter-kit/pin-palette";
import type { LatLng } from "../geometry";
import type { LocationState } from "../location";
import { lngLatOf } from "./conversions";
import type { MountedMapLibre } from "./mounted-map";
import { createPinIcon, paintPin } from "./pin-image";

/**
 * The selected and hovered pins, drawn again in the DOM over the pin layer: they stack above every
 * other pin, as Google's do, while the layer of every pin stays as it is. Changing a source or a
 * feature's state makes MapLibre lay out every pin again (80 ms for 4,000 in headless Chromium,
 * over the RFC's 50 ms for a selection); moving an element costs nothing. They only show: the pin
 * under each in the layer still takes the pointer, so clicks and hover stay one path.
 */
export interface FrontPins {
  /**
   * Shows `id`'s pin in front at `at`, stacked by `rank`, in the colours of its `state`; again, it
   * only moves, restacks and recolours.
   */
  show(id: string, at: LatLng, rank: number, state: LocationState): void;
  hide(id: string): void;
  isShown(id: string): boolean;
}

/** The map's front pins in `palette`: a marker each while shown, kept for the next once hidden. */
export function createFrontPins(
  { map, maplibre }: MountedMapLibre,
  palette: PinPalette,
): FrontPins {
  const shown = new Map<string, Marker>();
  const spare: Marker[] = [];
  const document = map.getContainer().ownerDocument;
  const newMarker = (colours: PinColours) =>
    new maplibre.Marker({ element: pinElement(document, colours), anchor: "bottom" });

  return {
    show(id, at, rank, state) {
      const known = shown.get(id);
      const colours = pinColoursIn(palette, state);
      const marker = known ?? spare.pop() ?? newMarker(colours);
      paintPin(marker.getElement() as HTMLImageElement, colours);
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

/** The pin's image in `colours`, letting the pointer through to the pin under it in the layer. */
function pinElement(document: Document, colours: PinColours): HTMLElement {
  const image = createPinIcon(document, colours);
  image.style.pointerEvents = "none";
  return image;
}
