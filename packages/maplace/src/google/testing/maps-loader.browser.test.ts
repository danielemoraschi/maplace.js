import { expect, it, onTestFinished } from "vitest";
import { sizedContainer } from "../../testing/container";
import { mapSourceFor } from "../map-source";
import { keyRefused, MAPS_JS_VERSION } from "./maps-loader";
import { TEST_OPTIONS } from "./subject";
import { describeWithMaps } from "./with-maps";

describeWithMaps("Maps JS for the tests", () => {
  it("runs the pinned version, not one Google falls back to", () => {
    expect(google.maps.version.startsWith(`${MAPS_JS_VERSION}.`)).toBe(true);
  });

  it("accepts the key: a map draws its tiles, and Google refuses nothing", async () => {
    const container = sizedContainer();
    const open = await mapSourceFor(TEST_OPTIONS).load();
    const { map, release } = open(container);
    onTestFinished(() => {
      release();
      container.remove();
    });
    let drawn = false;
    google.maps.event.addListenerOnce(map, "tilesloaded", () => {
      drawn = true;
    });
    await expect.poll(() => drawn || keyRefused(), { timeout: 15_000 }).toBe(true);
    expect(keyRefused(), "Google refused the key (gm_authFailure)").toBe(false);
  });
});
