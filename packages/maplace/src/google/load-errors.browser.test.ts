import { expect, it } from "vitest";
import { createMaplace } from "../maplace/create";
import { sizedContainer } from "../testing/container";
import { attachedToGoogle } from "./testing/store-on-google";
import { pageMapIn } from "./testing/subject";
import { describeWithMaps } from "./testing/with-maps";

const noMapId = expect.objectContaining({ code: "provider-load-failed", field: "mapId" });

/** A store attached to a map the page made in `container`, with or without the tests' map ID. */
function storeOnPageMap({ withMapId = false, container = sizedContainer() } = {}) {
  const map = pageMapIn(container, withMapId ? {} : { mapId: null });
  const maplace = createMaplace({ locations: [{ id: "rome", lat: 41.9, lng: 12.5 }] });
  return attachedToGoogle(maplace, { map, container });
}

describeWithMaps("Google maps that can't show markers", () => {
  it("fails the load on the page's map made without a map ID", async () => {
    const { maplace, errors, outcome } = storeOnPageMap();
    expect(await outcome).toEqual(noMapId);
    expect(errors).toEqual([noMapId]);
    expect(maplace.getSnapshot().loadState).toBe("error");
  });

  it("is ready on the page's map with a map ID, with no error", async () => {
    const { errors, outcome } = storeOnPageMap({ withMapId: true });
    expect(await outcome).toBe("ready");
    expect(errors).toEqual([]);
  });

  it("doesn't hold a hidden map back, and fails it once shown without a map ID", async () => {
    const container = sizedContainer();
    container.style.display = "none";
    const { maplace, errors, outcome } = storeOnPageMap({ container });
    expect(await outcome).toBe("ready");
    container.style.display = "";
    await expect.poll(() => maplace.getSnapshot().loadState).toBe("error");
    expect(errors).toEqual([noMapId]);
  });
});
