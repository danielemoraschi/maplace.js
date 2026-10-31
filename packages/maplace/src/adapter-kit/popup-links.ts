import { anchorOf } from "../anchor";
import type { Geometry } from "../geometry";
import type { ResolvedPopupOptions } from "../popup";
import { outsideUnstyled } from "../unstyled";

/** The class of a popup's row of links. */
export const POPUP_LINKS_CLASS = "maplace-popup-links";

/** In `:where()`, so any rule of the page wins; line-height gives a link its target, 24px at the usual root size. */
export const POPUP_LINKS_RULE =
  outsideUnstyled(`.${POPUP_LINKS_CLASS}`) +
  "{display:flex;flex-wrap:wrap;column-gap:.75rem;margin-top:.5rem;line-height:1.5rem}";

/** Coordinates as a URL takes them: never an exponent, and about 11 cm apart. */
const COORDINATE_DIGITS = 6;

/** A provider's maps site: its page showing a point, and its page of directions to one. */
export interface MapsPages {
  readonly openInMaps: MapsPage;
  readonly directions: MapsPage;
}

/** The address of a provider's page about a point. */
type MapsPage = (lat: string, lng: string) => string;

export interface PopupLinkSettings {
  readonly options: Pick<ResolvedPopupOptions, "openInMapsLabel" | "directionsLabel">;
  readonly pages: MapsPages;
}

/** A popup's links, in their row, and where they go. */
export interface PopupLinks {
  readonly element: HTMLElement;
  /** Sends the links to the point a popup on `geometry` points at. */
  pointAt(geometry: Geometry): void;
}

/** Links to where a popup on `geometry` points. None without a label: the popup is as it was. */
export function createPopupLinks(
  { options, pages }: PopupLinkSettings,
  document: Document,
  geometry: Geometry,
): PopupLinks | undefined {
  const { openInMapsLabel, directionsLabel } = options;
  if (openInMapsLabel === undefined && directionsLabel === undefined) return undefined;
  const element = document.createElement("div");
  element.className = POPUP_LINKS_CLASS;
  const aimed: Array<[HTMLAnchorElement, MapsPage]> = [];

  function addLink(label: string | undefined, page: MapsPage): void {
    if (label === undefined) return;
    const link = document.createElement("a");
    link.textContent = label;
    link.target = "_blank";
    link.rel = "noreferrer";
    // The space keeps the links apart where no style does, inside the opt-out.
    element.append(link, " ");
    aimed.push([link, page]);
  }

  addLink(openInMapsLabel, pages.openInMaps);
  addLink(directionsLabel, pages.directions);

  function pointAt(target: Geometry): void {
    const { lat, lng } = anchorOf(target);
    const latText = lat.toFixed(COORDINATE_DIGITS);
    const lngText = lng.toFixed(COORDINATE_DIGITS);
    for (const [link, page] of aimed) link.href = page(latText, lngText);
  }

  pointAt(geometry);
  return { element, pointAt };
}
