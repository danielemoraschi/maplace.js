import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { createGoogleAdapter } from "../google/index";
import { cornersLikeGoogle } from "../google/testing/corners-like-google";
import { panelOf } from "../google/testing/panels";
import { places } from "../google/testing/places";
import { type StubMap, stubMapsJsRecording } from "../google/testing/stub-libraries";
import { TEST_OPTIONS } from "../google/testing/subject";
import type { Location } from "../location";
import { MAP_SIZE } from "../testing/map-probe";
import { queried } from "../testing/queried";
import { LocationList } from "./location-list";
import { MaplaceMap } from "./maplace-map";
import { MaplaceProvider } from "./maplace-provider";
import { renderInto, storeCatcher } from "./testing/render";

afterEach(() => vi.unstubAllGlobals());

const MAP_CLASS = "list-panel-map";
const HEADING = "Choose a location:";
const googleAdapter = () => createGoogleAdapter(TEST_OPTIONS);

/** The map's own size, as a page gives it through `className`. */
function sizedMaps(): void {
  const rule = document.createElement("style");
  rule.textContent = `.${MAP_CLASS} { width: ${MAP_SIZE.width}px; height: ${MAP_SIZE.height}px }`;
  document.head.append(rule);
  onTestFinished(() => rule.remove());
}

/**
 * A headed `<LocationList position>` on a Google map made of stubs, its corners laid out as
 * Google lays them out once the map is ready; `show` renders the app again with other locations.
 */
async function listOnStubs(locations: readonly Location[]) {
  sizedMaps();
  const { maps } = stubMapsJsRecording();
  const { Keep, store } = storeCatcher();
  const app = (shown: readonly Location[]) => (
    <MaplaceProvider locations={shown}>
      <Keep />
      <MaplaceMap className={MAP_CLASS} createAdapter={googleAdapter}>
        <LocationList position="top-left" heading={HEADING} />
      </MaplaceMap>
    </MaplaceProvider>
  );
  const { render } = await renderInto(app(locations));
  await store().whenReady();
  const map = maps.at(-1) as StubMap;
  cornersLikeGoogle(map);
  const list = queried(map.getDiv(), ".maplace-list");
  return { map, list, show: (shown: readonly Location[]) => render(app(shown)) };
}

describe("<LocationList position> on a Google map, in its panel", () => {
  it("is the panel's own content, so the panel hides while nothing is listed", async () => {
    const { list, show } = await listOnStubs(places());
    const panel = panelOf(list);
    expect(list.parentElement).toBe(panel);
    await show(places().map((place) => ({ ...place, listed: false })));
    await expect.poll(() => getComputedStyle(panel).display).toBe("none");
    await show(places());
    await expect.poll(() => getComputedStyle(panel).display).not.toBe("none");
  });

  it("keeps a long list within the map's height, its entries scrolling under its heading", async () => {
    const { list, map } = await listOnStubs(places(30));
    const panel = panelOf(list).getBoundingClientRect();
    const listbox = queried(list, '[role="listbox"]');
    expect(panel.bottom).toBeLessThanOrEqual(map.getDiv().getBoundingClientRect().bottom - 10);
    expect(listbox.scrollHeight).toBeGreaterThan(listbox.clientHeight);
    expect(
      queried(list, ".maplace-list-heading").getBoundingClientRect().top,
    ).toBeGreaterThanOrEqual(panel.top);
  });
});
