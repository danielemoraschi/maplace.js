import { onTestFinished } from "vitest";
import type { Attachable } from "../../testing/attachable";
import { sizedContainer } from "../../testing/container";
import type { MapLibreAdapterOptions } from "../options";
import { maplibreParts, pageMapIn, removePageMaps, TEST_OPTIONS } from "./subject";
import { TEST_STYLE } from "./test-style";

/**
 * The test style with a source credited `attribution`, a layer using it so MapLibre's attribution
 * shows it, as it shows OpenFreeMap's.
 */
export function creditedOptions(attribution: string): MapLibreAdapterOptions {
  return {
    mapStyle: {
      ...TEST_STYLE,
      sources: {
        credit: { type: "geojson", data: { type: "FeatureCollection", features: [] }, attribution },
      },
      layers: [...TEST_STYLE.layers, { id: "credited", type: "circle", source: "credit" }],
    },
  };
}

/** The test style credited to a tile provider. */
export const CREDITED_OPTIONS = creditedOptions("© A tile provider");

/**
 * `maplace` attached to MapLibre on a map it creates in a sized container on the page, once its
 * load is ready, detached and gone after the test: the adapter (for `mountControl`), the container
 * and the map.
 */
export function onMapLibre(maplace: Attachable, options = TEST_OPTIONS) {
  return onMapLibreIn(maplace, sizedContainer(), options);
}

/** `maplace` attached as `onMapLibre` does, on a map it creates in `container`, removed after. */
export function onMapLibreIn(maplace: Attachable, container: HTMLElement, options = TEST_OPTIONS) {
  return attachedIn(maplace, container, options, () => container.remove());
}

/**
 * `maplace` attached as `onMapLibre` does, to the map the page made in a sized container first;
 * the page's map is removed after the test, once maplace is detached from it.
 */
export function onPageMapLibre(maplace: Attachable) {
  const container = sizedContainer();
  const map = pageMapIn(container);
  return attachedIn(maplace, container, { ...TEST_OPTIONS, map }, () => {
    removePageMaps();
    container.remove();
  });
}

async function attachedIn(
  maplace: Attachable,
  container: HTMLElement,
  options: MapLibreAdapterOptions,
  cleanUp: () => void,
) {
  const { adapter, state } = maplibreParts(options);
  const detach = maplace.attach(adapter, container);
  onTestFinished(() => {
    detach();
    cleanUp();
  });
  await maplace.whenReady();
  const map = state.mounted?.map;
  if (map === undefined) throw new Error("the store's load opened no map");
  return { adapter, container, map };
}
