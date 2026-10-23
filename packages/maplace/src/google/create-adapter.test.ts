// @vitest-environment happy-dom
// @vitest-environment-options { "settings": { "handleDisabledFileLoadingAsSuccess": true } }
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMaplace } from "../index";
import { createGoogleAdapter } from "./create-adapter";
import { requestIn } from "./maps-script-url";
import { mapsTags } from "./testing/maps-tags";
import { stubMapsJs } from "./testing/stub-libraries";

afterEach(() => {
  vi.unstubAllGlobals();
  document.head.replaceChildren();
  document.body.replaceChildren();
});

/** A store attached to a new container on the page, with the adapter given. */
function attached(adapter: ReturnType<typeof createGoogleAdapter>) {
  const container = document.body.appendChild(document.createElement("div"));
  const maplace = createMaplace();
  maplace.attach(adapter, container);
  return maplace;
}

describe("createGoogleAdapter with Maps JS's settings", () => {
  it("adds Maps JS with the settings at mount, not when the adapter is made", () => {
    const adapter = createGoogleAdapter({ apiKey: "k", language: "it", nonce: "n" });
    expect(mapsTags()).toHaveLength(0);
    attached(adapter);
    const [tag] = mapsTags();
    expect(requestIn(tag?.src ?? "")).toMatchObject({ apiKey: "k", language: "it" });
    expect(tag?.nonce).toBe("n");
  });

  it("an adapter not yet attached adds nothing", () => {
    createGoogleAdapter({ apiKey: "k" });
    expect(mapsTags()).toHaveLength(0);
  });

  it("a second map with the same settings shares the tag", () => {
    attached(createGoogleAdapter({ apiKey: "k" }));
    attached(createGoogleAdapter({ apiKey: "k" }));
    expect(mapsTags()).toHaveLength(1);
  });

  it("a map asking for another key fails its load with provider-load-failed on apiKey", async () => {
    attached(createGoogleAdapter({ apiKey: "k" }));
    const second = attached(createGoogleAdapter({ apiKey: "other" }));
    await expect(second.whenReady()).rejects.toMatchObject({
      code: "provider-load-failed",
      field: "apiKey",
      message: expect.stringContaining("another apiKey"),
    });
    expect(mapsTags()).toHaveLength(1);
  });

  it("without apiKey adds no tag", async () => {
    const maplace = attached(createGoogleAdapter());
    await expect(maplace.whenReady()).rejects.toMatchObject({ code: "provider-load-failed" });
    expect(mapsTags()).toHaveLength(0);
  });

  it("takes Maps JS from a loader with no tag as it is", () => {
    stubMapsJs();
    attached(createGoogleAdapter({ apiKey: "k" }));
    expect(mapsTags()).toHaveLength(0);
  });
});
