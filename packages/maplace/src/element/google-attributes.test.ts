// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { googleSettingsOf } from "./google-attributes";
import { elementWith } from "./testing/dom";

describe("googleSettingsOf", () => {
  it("reads the map ID and the Maps JS settings, leaving out what isn't written", () => {
    const element = elementWith({ "map-id": "m", "api-key": "k", language: "it", nonce: "n0" });
    expect(googleSettingsOf(element)).toEqual({
      adapterOptions: { mapId: "m", colorScheme: undefined, mapOptions: undefined },
      script: { apiKey: "k", version: undefined, language: "it", region: undefined, nonce: "n0" },
    });
  });

  it("reads the map's colour scheme and Google's options into the adapter's options", () => {
    const element = elementWith({
      "map-id": "m",
      "color-scheme": "follow-system",
      "map-options": '{"disableDefaultUI":true}',
    });
    expect(googleSettingsOf(element).adapterOptions).toEqual({
      mapId: "m",
      colorScheme: "follow-system",
      mapOptions: { disableDefaultUI: true },
    });
  });

  it("takes an attribute left empty as not given, so an empty api-key is no key", () => {
    const { script } = googleSettingsOf(elementWith({ "map-id": "m", "api-key": "", region: "" }));
    expect(script).toMatchObject({ apiKey: undefined, region: undefined });
  });

  it.each([{}, { "map-id": "" }])(
    "leaves the map ID to the adapter when none is given",
    (attributes) => {
      expect(googleSettingsOf(elementWith(attributes)).adapterOptions.mapId).toBeUndefined();
    },
  );

  it("refuses a bad map setting", () => {
    expect(() => googleSettingsOf(elementWith({ "map-id": "m", "color-scheme": "night" }))).toThrow(
      expect.objectContaining({ code: "invalid-input", field: "color-scheme" }),
    );
  });
});
