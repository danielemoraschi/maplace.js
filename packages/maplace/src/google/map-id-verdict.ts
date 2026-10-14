/// <reference types="google.maps" />
import { hasSize, sizeOf } from "../adapter-kit/map-size";
import { MaplaceError } from "../errors";
import type { MapVerdict, MountedMap } from "./mounted-map";

/**
 * The longest a shown map waits for Google's verdict. Measured on Maps JS 3.66: 5–175 ms after
 * the map is made; a hidden map gets none until it is shown, so it doesn't wait at all.
 */
export const VERDICT_WAIT_MS = 2000;

const NO_MAP_ID =
  "attach: your map has no map ID, so Google shows no markers on it: make it with a mapId " +
  "(DEMO_MAP_ID for development)";

/**
 * Whether the page's own map can show markers: Google refuses Advanced Markers on a map made
 * without a map ID. Settles once Google has said, at once for a hidden map, or after
 * `VERDICT_WAIT_MS`; a verdict that comes later is still reported, while the map is open.
 */
export const mapIdVerdict: MapVerdict = (mounted) => {
  const available = advancedMarkersAvailable(mounted);
  if (available === undefined) return new Promise((settle) => awaitVerdict(mounted, settle));
  if (!available) reportNoMapId(mounted);
  return Promise.resolve();
};

function awaitVerdict(mounted: MountedMap, settle: () => void): void {
  const { map } = mounted;
  const listener = map.addListener("renderingtype_changed", () => {
    stop();
    if (advancedMarkersAvailable(mounted) === false) reportNoMapId(mounted);
  });
  const wait = setTimeout(settle, VERDICT_WAIT_MS);
  function stop(): void {
    listener.remove();
    clearTimeout(wait);
    settle();
  }
  mounted.onDestroy(stop);
  if (!hasSize(sizeOf(map.getDiv()))) settle();
}

/**
 * Measured on Maps JS 3.66: the capabilities read `true` until Google has initialised the map,
 * which sets its rendering type; undefined until then.
 */
function advancedMarkersAvailable({ map, libraries }: MountedMap): boolean | undefined {
  if (map.getRenderingType() === libraries.maps.RenderingType.UNINITIALIZED) return undefined;
  return map.getMapCapabilities().isAdvancedMarkersAvailable !== false;
}

function reportNoMapId(mounted: MountedMap): void {
  const error = new MaplaceError("provider-load-failed", NO_MAP_ID, { field: "mapId" });
  mounted.live()?.reportError(error);
}
