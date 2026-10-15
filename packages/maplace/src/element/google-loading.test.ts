// @vitest-environment happy-dom
// @vitest-environment-options { "settings": { "handleDisabledFileLoadingAsSuccess": true } }
import { afterEach, describe, expect, it, vi } from "vitest";
import { MAPS_SCRIPT_ORIGIN } from "../google/maps-script-url";
import { stubMapsJs } from "../google/testing/stub-libraries";
import { mapsLoadingFor } from "./google-loading";

afterEach(() => {
  vi.unstubAllGlobals();
  document.head.replaceChildren();
});

const mapsTags = () => document.querySelectorAll(`script[src^="${MAPS_SCRIPT_ORIGIN}"]`);

describe("mapsLoadingFor", () => {
  it("adds Maps JS once, and a second map without a key shares it", async () => {
    const first = mapsLoadingFor({ key: "k", language: "it" }, document);
    const second = mapsLoadingFor({ language: "it" }, document);
    expect(mapsTags()).toHaveLength(1);
    stubMapsJs();
    await expect(Promise.all([first, second])).resolves.toBeDefined();
  });

  it("refuses a map asking the page's Maps JS for another setting, naming the attribute", () => {
    void mapsLoadingFor({ key: "k", language: "it" }, document);
    expect(() => mapsLoadingFor({ key: "k", language: "en" }, document)).toThrow(
      expect.objectContaining({ code: "invalid-input", field: "language" }),
    );
  });

  it("refuses to load Maps JS without a key", () => {
    expect(() => mapsLoadingFor({ version: "3.66" }, document)).toThrow(
      expect.objectContaining({ field: "api-key" }),
    );
    expect(mapsTags()).toHaveLength(0);
  });

  it("takes Maps JS the page loaded without a tag of its own, adding none", async () => {
    stubMapsJs();
    await expect(mapsLoadingFor({}, document)).resolves.toBeUndefined();
    expect(mapsTags()).toHaveLength(0);
  });
});
