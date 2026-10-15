// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { googleSettingsOf } from "./google-attributes";
import { elementWith } from "./testing/dom";

describe("googleSettingsOf", () => {
  it("reads the map ID and the Maps JS settings, leaving out what isn't written", () => {
    const element = elementWith({ "map-id": "m", "api-key": "k", language: "it", nonce: "n0" });
    expect(googleSettingsOf(element)).toEqual({
      mapId: "m",
      script: { key: "k", version: undefined, language: "it", region: undefined, nonce: "n0" },
    });
  });

  it("takes an attribute left empty as not given, so an empty api-key is no key", () => {
    const { script } = googleSettingsOf(elementWith({ "map-id": "m", "api-key": "", region: "" }));
    expect(script).toMatchObject({ key: undefined, region: undefined });
  });

  it.each([{}, { "map-id": "" }])("refuses a map without a map ID", (attributes) => {
    expect(() => googleSettingsOf(elementWith(attributes))).toThrow(
      expect.objectContaining({ code: "invalid-input", field: "map-id" }),
    );
  });
});
