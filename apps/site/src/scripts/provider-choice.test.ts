// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { keepProvider, keptProvider, PROVIDER_CHOICE_KEY } from "./provider-choice.ts";

const blocked = (): Storage => {
  throw new DOMException("site data is blocked", "SecurityError");
};

describe("keptProvider and keepProvider", () => {
  beforeEach(() => sessionStorage.clear());

  it("keep the visit's choice, under the key the privacy page names", () => {
    keepProvider(() => sessionStorage, "google");
    expect(keptProvider(() => sessionStorage)).toBe("google");
    expect(sessionStorage.getItem("maplace-site:provider")).toBe("google");
    expect(PROVIDER_CHOICE_KEY).toBe("maplace-site:provider");
  });

  it("give MapLibre when nothing is kept", () => {
    expect(keptProvider(() => sessionStorage)).toBe("maplibre");
  });

  it("give MapLibre for a value they don't know", () => {
    sessionStorage.setItem(PROVIDER_CHOICE_KEY, "leaflet");
    expect(keptProvider(() => sessionStorage)).toBe("maplibre");
  });

  it("give MapLibre, and keep nothing, when the browser keeps no site data", () => {
    expect(() => keepProvider(blocked, "google")).not.toThrow();
    expect(keptProvider(blocked)).toBe("maplibre");
  });
});
