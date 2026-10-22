import "./stylesheet";
import { Map as MapLibreMap } from "maplibre-gl";
import { elementFilling } from "../../adapter-kit/map-element";
import type { ConformanceGroup, ConformanceSubject } from "../../testing/conformance/subject";
import { assembleMapLibreAdapter } from "../assemble";
import type { MapLibreAdapterOptions } from "../options";
import { probedMapState } from "./probe";
import { TEST_STYLE } from "./test-style";

/** The tests' MapLibre adapter: on the local test style, so nothing leaves the machine. */
export const TEST_OPTIONS: MapLibreAdapterOptions = { mapStyle: TEST_STYLE };

/** What M1 draws: shapes' editing comes with M2, on-map controls with M4. */
const M1_GROUPS: readonly ConformanceGroup[] = [
  "declarations",
  "lifecycle",
  "drawing",
  "presentation",
  "popups",
  "camera",
  "reports",
  "container",
  "route",
  "cluster",
  "controls",
];

/** A new MapLibre adapter, its probe, and the map state the adapter draws into. */
export function maplibreParts(options = TEST_OPTIONS) {
  const { state, probe } = probedMapState();
  return { state, adapter: assembleMapLibreAdapter(options, state), probe };
}

/** MapLibre on a map it creates, for the conformance suite. */
export const MAPLIBRE_SUBJECT: ConformanceSubject = {
  name: "maplibre",
  groups: M1_GROUPS,
  create: () => maplibreParts(),
};

/** The maps pages made for the tests, removed after each (maplace never removes a page's map). */
const pageMaps: MapLibreMap[] = [];

/**
 * MapLibre on the page's own map, made in the container first, as a page would. Only in a
 * container on the page: the suite reads an adapter's declarations from one in a detached
 * element, where no map is needed.
 */
export const PAGE_MAP_SUBJECT: ConformanceSubject = {
  name: "maplibre on the page's map",
  groups: M1_GROUPS,
  create: (container) =>
    container.isConnected ? maplibreParts({ map: pageMapIn(container) }) : maplibreParts(),
};

/** A map the page made in `container`, on the test style, as a page would before attaching. */
export function pageMapIn(container: HTMLElement): MapLibreMap {
  const map = new MapLibreMap({ container: elementFilling(container), style: TEST_STYLE });
  pageMaps.push(map);
  return map;
}

/** Removes the maps pages made: run after each check that may have made one. */
export function removePageMaps(): void {
  for (const map of pageMaps.splice(0)) map.remove();
}
