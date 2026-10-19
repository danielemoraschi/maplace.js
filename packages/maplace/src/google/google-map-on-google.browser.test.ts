/// <reference types="google.maps" />
import { afterEach, expect, it, onTestFinished, vi } from "vitest";
import { sizedContainer } from "../testing/container";
import { createGoogleMap } from "./google-map";
import { settledOnMap } from "./testing/controls-placed";
import { panelOf, queried } from "./testing/panels";
import { places } from "./testing/places";
import { TILES_TIMEOUT_MS } from "./testing/store-on-google";
import { TEST_OPTIONS } from "./testing/subject";
import { describeWithMaps } from "./testing/with-maps";

/** How far a panel may sit from the map's edges: Google's own controls keep a margin. */
const CORNER_MARGIN_PX = 24;

describeWithMaps("createGoogleMap on Google", () => {
  afterEach(() => document.body.replaceChildren());

  it("is ready on a map it makes in the selected element, its list in a panel top-right", async () => {
    sizedContainer().id = "google-map-shortcut";
    const maplace = createGoogleMap("#google-map-shortcut", {
      ...TEST_OPTIONS,
      locations: places(),
      list: { heading: "Choose a location:" },
    });
    onTestFinished(() => maplace.destroy());
    await maplace.whenReady();
    const container = document.getElementById("google-map-shortcut") as HTMLElement;
    const heading = await vi.waitFor(() => queried(container, ".maplace-list-heading"), {
      timeout: TILES_TIMEOUT_MS,
    });
    await settledOnMap(heading);
    const panel = panelOf(heading).getBoundingClientRect();
    const map = container.getBoundingClientRect();
    expect(heading.textContent).toBe("Choose a location:");
    expect(map.right - panel.right).toBeLessThan(CORNER_MARGIN_PX);
    expect(panel.top - map.top).toBeLessThan(CORNER_MARGIN_PX);
    expect(panel.left).toBeGreaterThan(map.left + map.width / 2);
  });
});
