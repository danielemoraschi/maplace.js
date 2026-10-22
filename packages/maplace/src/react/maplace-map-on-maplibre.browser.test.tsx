import type { ReactNode } from "react";
import { describe, expect, it, onTestFinished } from "vitest";
import type { Location, LocationState } from "../index";
import { createMapLibreAdapter } from "../maplibre/index";
import "../maplibre/testing/stylesheet";
import { TEST_STYLE } from "../maplibre/testing/test-style";
import {
  LocationList,
  MapControl,
  MaplaceMap,
  type MaplaceMapProps,
  MaplaceProvider,
} from "./index";
import { inAct, ROOT_MODES, type RootMode, renderInto, storeCatcher } from "./testing/render";
import { TOWNS } from "./testing/towns";

// React on real MapLibre (M7): `<MaplaceMap>` takes MapLibre's factory as it takes Google's.

const MAP_CLASS = "maplibre-react-map";
const createAdapter = () => createMapLibreAdapter({ mapStyle: TEST_STYLE });
const LOAD = { timeout: 15_000 };

function sizedMaps(): void {
  const rule = document.createElement("style");
  rule.textContent = `.${MAP_CLASS} { width: 600px; height: 400px }`;
  document.head.append(rule);
  onTestFinished(() => rule.remove());
}

const icon = (location: Location, { selected }: LocationState) => (
  <span className="town-icon">{selected ? `★${location.id}` : location.id}</span>
);

interface AppSetup {
  readonly map?: Partial<MaplaceMapProps>;
  readonly mode?: RootMode;
  readonly onPopupOpen?: (event: { readonly element: HTMLElement }) => void;
  readonly children?: ReactNode;
}

/** An app on MapLibre, rendered as `setup` says, its map ready. */
async function renderedApp({ map, mode, onPopupOpen, children }: AppSetup = {}) {
  sizedMaps();
  const { Keep, store } = storeCatcher();
  const rendered = await renderInto(
    <MaplaceProvider locations={TOWNS} onPopupOpen={onPopupOpen}>
      <Keep />
      <MaplaceMap className={MAP_CLASS} createAdapter={createAdapter} {...map}>
        {children}
      </MaplaceMap>
    </MaplaceProvider>,
    mode,
  );
  await store().whenReady();
  return { ...rendered, store };
}

describe("<MaplaceMap> on MapLibre", () => {
  it("draws a MapLibre map in its div, and takes it down on unmount", async () => {
    const { container, unmount } = await renderedApp();
    expect(container.querySelector(`.${MAP_CLASS} .maplibregl-canvas`)).not.toBeNull();
    await unmount();
    expect(document.querySelector(".maplibregl-map")).toBeNull();
  });

  it("opens one map under StrictMode, whose effects run twice", async () => {
    const { container } = await renderedApp({ mode: ROOT_MODES[1] });
    expect(container.querySelectorAll(".maplibregl-canvas")).toHaveLength(1);
  });

  it("renders markerIcon's React content as MapLibre's DOM markers, kept current with the selection", async () => {
    const { container, store } = await renderedApp({ map: { markerIcon: icon } });
    await expect
      .poll(() => container.querySelectorAll(".maplibregl-marker .town-icon").length, LOAD)
      .toBe(TOWNS.length);
    await inAct(() => store().select("south"));
    await expect
      .poll(() => [...container.querySelectorAll(".town-icon")].map((node) => node.textContent))
      .toContain("★south");
  });

  it("renders popupContent's React content in MapLibre's popup before popupOpen", async () => {
    const atOpen: (string | null)[] = [];
    const popupContent = (location: Location) => <p className="town-popup">{location.id} town</p>;
    const { container, store } = await renderedApp({
      map: { popupContent },
      onPopupOpen: ({ element }) => atOpen.push(element.textContent),
    });
    await inAct(() => store().select("north"));
    await expect.poll(() => atOpen, LOAD).toEqual([expect.stringContaining("north town")]);
    expect(container.querySelector(".maplibregl-popup .town-popup")?.textContent).toBe(
      "north town",
    );
  });

  it("puts <LocationList position> and <MapControl> on the map through mountControl", async () => {
    const children = (
      <>
        <LocationList position="top-left" />
        <MapControl position="bottom-right">
          <button type="button" className="own-control">
            Here
          </button>
        </MapControl>
      </>
    );
    const { container } = await renderedApp({ children });
    const map = container.querySelector(`.${MAP_CLASS}`);
    await expect.poll(() => map?.querySelector('[role="listbox"]'), LOAD).not.toBeNull();
    expect(map?.querySelector(".own-control")).not.toBeNull();
  });
});
