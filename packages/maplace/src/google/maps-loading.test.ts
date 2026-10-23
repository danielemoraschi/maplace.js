// @vitest-environment happy-dom
// @vitest-environment-options { "settings": { "handleDisabledFileLoadingAsSuccess": true } }
import { afterEach, describe, expect, it, vi } from "vitest";
import { MaplaceError } from "../errors";
import { addedMapsLoading, pageMapsLoading } from "./maps-loading";
import { mapsTags } from "./testing/maps-tags";
import { stubMapsJs } from "./testing/stub-libraries";

afterEach(() => {
  vi.unstubAllGlobals();
  document.head.replaceChildren();
});

const conflictError = (setting: string) =>
  new MaplaceError("invalid-input", `another ${setting}`, { field: setting });

describe("pageMapsLoading", () => {
  it("is undefined when nothing on the page loads Maps JS", () => {
    expect(pageMapsLoading({ apiKey: "k" }, document, conflictError)).toBeUndefined();
  });

  it("shares the page's tag, whoever added it", async () => {
    void addedMapsLoading({ apiKey: "k" }, document);
    const shared = pageMapsLoading({ apiKey: "k" }, document, conflictError);
    stubMapsJs();
    await expect(shared).resolves.toBeUndefined();
    expect(mapsTags()).toHaveLength(1);
  });

  it("fails with the caller's error for a setting the page's tag loaded differently", () => {
    void addedMapsLoading({ apiKey: "k", region: "IT" }, document);
    expect(() => pageMapsLoading({ region: "FR" }, document, conflictError)).toThrow(
      expect.objectContaining({ field: "region" }),
    );
  });

  it("takes Maps JS loaded with no tag as it is", async () => {
    stubMapsJs();
    const loading = pageMapsLoading({ apiKey: "another" }, document, conflictError);
    await expect(loading).resolves.toBeUndefined();
    expect(mapsTags()).toHaveLength(0);
  });
});

describe("addedMapsLoading", () => {
  it("adds one tag, ready once Maps JS can import libraries", async () => {
    const loading = addedMapsLoading({ apiKey: "k", nonce: "n" }, document);
    expect(mapsTags()).toHaveLength(1);
    expect(mapsTags()[0]?.nonce).toBe("n");
    stubMapsJs();
    await expect(loading).resolves.toBeUndefined();
  });

  it("fails every map sharing a tag that failed to load", async () => {
    const loading = addedMapsLoading({ apiKey: "k" }, document);
    const shared = pageMapsLoading({}, document, conflictError);
    mapsTags()[0]?.dispatchEvent(new Event("error"));
    await expect(loading).rejects.toMatchObject({ code: "provider-load-failed" });
    await expect(shared).rejects.toMatchObject({ code: "provider-load-failed" });
  });
});
