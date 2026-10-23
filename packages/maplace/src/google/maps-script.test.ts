// @vitest-environment happy-dom
// @vitest-environment-options { "settings": { "handleDisabledFileLoadingAsSuccess": true } }
import { afterEach, describe, expect, it, vi } from "vitest";
import { addMapsScript, MAPS_READY_POLL_MS, mapsReadyFrom, pageMapsScript } from "./maps-script";
import { stubMapsJs } from "./testing/stub-libraries";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.head.replaceChildren();
});

describe("addMapsScript", () => {
  it("adds one asynchronous tag with the nonce, which is then the page's", () => {
    const script = addMapsScript({ apiKey: "k", nonce: "n0" }, document);
    expect([script.async, script.nonce, script.src]).toEqual([
      true,
      "n0",
      "https://maps.googleapis.com/maps/api/js?key=k&loading=async",
    ]);
    expect(pageMapsScript(document)).toBe(script);
  });

  it("finds a tag the page added itself", () => {
    const own = document.createElement("script");
    own.src = "https://maps.googleapis.com/maps/api/js?key=k&callback=init";
    document.head.append(own);
    expect(pageMapsScript(document)).toBe(own);
  });
});

describe("mapsReadyFrom", () => {
  it("resolves once Maps JS can import libraries, which comes some time after the tag", async () => {
    vi.useFakeTimers();
    const ready = vi.fn();
    void mapsReadyFrom(addMapsScript({ apiKey: "k" }, document)).then(ready);
    await vi.advanceTimersByTimeAsync(MAPS_READY_POLL_MS * 3);
    expect(ready).not.toHaveBeenCalled();
    stubMapsJs();
    await vi.advanceTimersByTimeAsync(MAPS_READY_POLL_MS);
    expect(ready).toHaveBeenCalledOnce();
  });

  it("leaves a failure no map waits for unreported, as the map that waits reports it", async () => {
    const script = addMapsScript({ apiKey: "k" }, document);
    void mapsReadyFrom(script);
    script.dispatchEvent(new Event("error"));
    await new Promise((resolve) => setTimeout(resolve));
    expect(script.hasAttribute("data-maplace-maps-failed")).toBe(true);
  });

  it("waits once per tag, however many maps share it", () => {
    const script = addMapsScript({ apiKey: "k" }, document);
    expect(mapsReadyFrom(script)).toBe(mapsReadyFrom(script));
  });

  it("rejects with provider-load-failed when the tag fails, and at once for anyone asking later", async () => {
    const script = addMapsScript({ apiKey: "k" }, document);
    const first = mapsReadyFrom(script);
    script.dispatchEvent(new Event("error"));
    await expect(first).rejects.toMatchObject({ code: "provider-load-failed" });
    await expect(mapsReadyFrom(script)).rejects.toMatchObject({ code: "provider-load-failed" });
  });
});
