import { describe, expect, it } from "vitest";
import { exampleFolder, FIRST_PROVIDER, isProvider } from "./example-providers.ts";

describe("exampleFolder", () => {
  it("puts MapLibre's versions in the example's maplibre folder, Google's in the example's own", () => {
    expect(exampleFolder("simple", "google")).toBe("simple");
    expect(exampleFolder("simple", "maplibre")).toBe("simple/maplibre");
  });
});

describe("FIRST_PROVIDER", () => {
  it("is Google, offered first", () => {
    expect(FIRST_PROVIDER).toBe("google");
  });
});

describe("isProvider", () => {
  it("is whether a value names a provider", () => {
    expect(isProvider("maplibre")).toBe(true);
    expect(isProvider("leaflet")).toBe(false);
  });
});
