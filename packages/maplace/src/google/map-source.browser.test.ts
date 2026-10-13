import { afterEach, expect, it, onTestFinished } from "vitest";
import { mountSubject, unmountAll } from "../testing/conformance/harness";
import { sizedContainer } from "../testing/container";
import { createdMapOptions } from "./map-source";
import type { GoogleAdapterOptions } from "./options";
import { googleParts, TEST_OPTIONS } from "./testing/subject";
import { describeWithMaps } from "./testing/with-maps";

/** A Google adapter mounted as the store would, taken down after the test. */
async function mountedGoogle(options: GoogleAdapterOptions = TEST_OPTIONS) {
  const parts = googleParts(options);
  return { state: parts.state, ...(await mountSubject({ name: "google", create: () => parts })) };
}

describeWithMaps("Google maps", () => {
  afterEach(unmountAll);

  it("draws on the page's own map and leaves it there, still working, after destroy", async () => {
    const pageMapElement = sizedContainer();
    onTestFinished(() => pageMapElement.remove());
    const { Map: GoogleMap } = await google.maps.importLibrary("maps");
    const map = new GoogleMap(pageMapElement, createdMapOptions(TEST_OPTIONS));
    const { destroy } = await mountedGoogle({ ...TEST_OPTIONS, map });
    destroy();
    expect(map.getDiv().isConnected).toBe(true);
    map.setZoom(3);
    expect(map.getZoom()).toBe(3);
  });

  it("keeps two maps on one page apart: destroying one leaves the other", async () => {
    const first = await mountedGoogle();
    const second = await mountedGoogle();
    first.destroy();
    expect(first.container.children).toHaveLength(0);
    expect(second.state.map?.getDiv().isConnected).toBe(true);
  });
});
