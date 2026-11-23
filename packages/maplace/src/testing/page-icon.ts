import { isPinIcon } from "../adapter-kit/pin-icon";

/** The page's icon a marker element shows: none for maplace's own pin, a default marker's. */
export function pageIconOf(marker: Element | undefined): Node | undefined {
  const icon = marker?.firstChild ?? undefined;
  return isPinIcon(icon) ? undefined : icon;
}

/** maplace's own pin a marker element shows; none for a page's icon. */
export function pinIconOf(marker: Element | undefined): HTMLImageElement | undefined {
  const icon = marker?.firstChild ?? undefined;
  return isPinIcon(icon) ? (icon as HTMLImageElement) : undefined;
}
