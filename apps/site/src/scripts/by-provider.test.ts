// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { byProvider, providerOf, versionOf } from "./by-provider.ts";

function inVersion(provider: string): HTMLElement {
  document.body.innerHTML = `<div data-live-version="html" data-provider="${provider}"><maplace-map id="m"></maplace-map></div>`;
  return document.getElementById("m") as HTMLElement;
}

describe("providerOf", () => {
  it("reads the provider of the version an element is in", () => {
    expect(providerOf(inVersion("maplibre"))).toBe("maplibre");
    expect(providerOf(inVersion("google").parentElement as HTMLElement)).toBe("google");
  });

  it("throws, naming the element, outside a version or for an unknown provider", () => {
    document.body.innerHTML = '<maplace-map id="lost"></maplace-map>';
    expect(() => providerOf(document.getElementById("lost") as HTMLElement)).toThrow(
      `<maplace-map id="lost"> isn't in a version`,
    );
    expect(() => providerOf(inVersion("leaflet"))).toThrow(
      `<maplace-map id="m">'s version names no known provider: "leaflet"`,
    );
  });
});

describe("versionOf", () => {
  it("is the version an element is in, or throws, naming the element, outside one", () => {
    const map = inVersion("google");
    expect(versionOf(map)).toBe(map.parentElement);
    document.body.innerHTML = "<p></p>";
    expect(() => versionOf(document.querySelector("p") as Element)).toThrow(
      "<p> isn't in a version",
    );
  });
});

describe("byProvider", () => {
  it("calls the provider's handler", () => {
    const google = vi.fn(() => "google's");
    const maplibre = vi.fn(() => "maplibre's");
    const map = inVersion("maplibre");
    expect(byProvider({ google, maplibre })(map)).toBe("maplibre's");
    expect(maplibre).toHaveBeenCalledWith(map);
    expect(google).not.toHaveBeenCalled();
  });
});
