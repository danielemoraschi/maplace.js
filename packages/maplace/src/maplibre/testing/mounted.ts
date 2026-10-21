import { type MountSettings, mountSubject, startMount } from "../../testing/conformance/harness";
import type { MapLibreAdapterOptions } from "../options";
import { maplibreParts, pageMapIn, TEST_OPTIONS } from "./subject";

/** A MapLibre adapter mounted as the store would, taken down after the test (`unmountAll`). */
export async function mountedMapLibre(
  options: MapLibreAdapterOptions = TEST_OPTIONS,
  settings?: MountSettings,
) {
  const parts = maplibreParts(options);
  const mounted = await mountSubject({ name: "maplibre", create: () => parts }, settings);
  return { state: parts.state, ...mounted };
}

/** A MapLibre adapter starting to mount, not waited for: a load that may fail. */
export function mountingMapLibre(options: MapLibreAdapterOptions) {
  const parts = maplibreParts(options);
  return { state: parts.state, ...startMount({ name: "maplibre", create: () => parts }) };
}

/** A MapLibre adapter mounted on a map the page made first, with the map. */
export async function mountedOnPageMap() {
  const created: { map?: ReturnType<typeof pageMapIn> } = {};
  const mounted = await mountSubject({
    name: "maplibre on the page's map",
    create(container) {
      created.map = pageMapIn(container);
      return maplibreParts({ map: created.map });
    },
  });
  const { map } = created;
  if (map === undefined) throw new Error("the page's map wasn't made");
  return { map, ...mounted };
}
