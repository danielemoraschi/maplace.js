import { expect, it } from "vitest";
import { createMaplace } from "../maplace/create";
import { QUIET_MS, wait } from "./testing/map-waits";
import { keyRefused } from "./testing/maps-loader";
import { attachedToGoogle } from "./testing/store-on-google";
import { describeWithRefusedKey } from "./testing/with-maps";

const refused = expect.objectContaining({ code: "provider-auth-failed" });

const ROME = { id: "rome", lat: 41.9, lng: 12.5, title: "Rome", content: "Rome" };
const PARIS = { id: "paris", lat: 48.86, lng: 2.35, title: "Paris" };

/** A store attached to Google, drawing a marker, its popup and a control. */
function storeOnGoogle() {
  const attached = attachedToGoogle(createMaplace({ locations: [ROME], selectedId: "rome" }));
  attached.adapter.mountControl(document.createElement("button"), "top-left");
  return attached;
}

describeWithRefusedKey("Google refusing the page's key", () => {
  it("fails the load of every store on the page, the page's own handler still run", async () => {
    const first = storeOnGoogle();
    await expect.poll(() => first.maplace.getSnapshot().loadState, { timeout: 5000 }).toBe("error");
    expect(first.errors).toEqual([refused]);
    // Google's own message stays on its map; nothing maplace asks of it later throws or reports.
    expect(first.container.children).toHaveLength(1);
    first.maplace.setLocations([ROME, PARIS]);
    first.maplace.select("paris");
    first.adapter.mountControl(document.createElement("button"), "bottom-left");
    await wait(QUIET_MS);
    expect(first.errors).toEqual([refused]);
    // The test loader's gm_authFailure stands for the page's own, set before maplace came.
    expect(keyRefused()).toBe(true);
    // Google says it once per page: a store attached later hears it from maplace.
    const later = storeOnGoogle();
    expect(await later.outcome).toEqual(refused);
    expect(later.errors).toEqual([refused]);
  });
});
