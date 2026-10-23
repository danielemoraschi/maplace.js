import { describe, expect, it } from "vitest";
import { conflictingSetting, mapsScriptUrl, requestIn } from "./maps-script-url";

describe("mapsScriptUrl", () => {
  it("asks for each setting given, encoded, loading asynchronously", () => {
    expect(mapsScriptUrl({ apiKey: "k&1", version: "3.66", language: "it" })).toBe(
      "https://maps.googleapis.com/maps/api/js?key=k%261&v=3.66&language=it&loading=async",
    );
  });

  it("reads back what it asked for", () => {
    const request = { apiKey: "k&1", version: "weekly", region: "GB" };
    expect(requestIn(mapsScriptUrl(request))).toEqual(request);
  });
});

describe("conflictingSetting", () => {
  const loaded = { apiKey: "k", version: "3.66", language: "it" };

  it("names the first setting asked for differently", () => {
    expect(conflictingSetting({ apiKey: "k", language: "en" }, loaded)).toBe("language");
    expect(conflictingSetting({ apiKey: "other" }, loaded)).toBe("apiKey");
  });

  it("finds none when every setting asked for matches, or is left out", () => {
    expect(conflictingSetting({ apiKey: "k" }, loaded)).toBeUndefined();
    expect(conflictingSetting({}, loaded)).toBeUndefined();
  });

  it("finds a setting the page never loaded with a conflict", () => {
    expect(conflictingSetting({ region: "GB" }, loaded)).toBe("region");
  });
});
