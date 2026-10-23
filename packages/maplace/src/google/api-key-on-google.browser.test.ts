import { expect, it } from "vitest";
import { createGoogleMap } from "./google-map";
import { requestIn } from "./maps-script-url";
import { MAPS_JS_VERSION } from "./testing/maps-loader";
import { mapsTags } from "./testing/maps-tags";
import { TILES_TIMEOUT_MS } from "./testing/store-on-google";
import { describeWithKey } from "./testing/with-key";

// Its own file, so its own page: no Maps JS on it until the map below adds it.
describeWithKey("createGoogleMap given an apiKey", (key) => {
  it("adds one Maps JS tag with its settings, and draws", async () => {
    const container = document.body.appendChild(document.createElement("div"));
    container.style.height = "240px";
    const maplace = createGoogleMap(container, {
      apiKey: key,
      version: MAPS_JS_VERSION,
      language: "it",
      mapId: "DEMO_MAP_ID",
      locations: [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }],
    });
    const [tag, ...others] = mapsTags();
    expect(others).toEqual([]);
    expect(requestIn(tag?.src ?? "").language).toBe("it");
    await expect
      .poll(() => maplace.getSnapshot().loadState, { timeout: TILES_TIMEOUT_MS })
      .toBe("ready");
    // Markers are drawn once the map is ready, a moment after it says so.
    await expect.poll(() => container.querySelectorAll("gmp-advanced-marker").length).toBe(1);
    maplace.destroy();
  });
});
