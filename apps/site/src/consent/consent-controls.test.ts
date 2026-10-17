// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { startConsent } from "./consent-controls.ts";
import { createConsentStore } from "./consent-store.ts";

/** The page as the head's script leaves it: `data-maps` set from the kept consent. */
function page({ granted = false, headRan = true } = {}) {
  document.documentElement.dataset.maps = granted && headRan ? "on" : "off";
  document.body.innerHTML = `
    <button data-maps-grant>Load Google Maps</button>
    <footer><button data-maps-toggle></button></footer>`;
  const store = createConsentStore(() => localStorage);
  if (granted) store.grant();
  const openMaps = vi.fn();
  const reload = vi.fn();
  startConsent({ document, store, openMaps, reload });
  const grant = document.querySelector("[data-maps-grant]") as HTMLButtonElement;
  const toggle = document.querySelector("[data-maps-toggle]") as HTMLButtonElement;
  return {
    store,
    openMaps,
    reload,
    grant,
    toggle,
    maps: () => document.documentElement.dataset.maps,
  };
}

describe("startConsent", () => {
  beforeEach(() => localStorage.clear());

  it("keeps the maps shut on a first visit", () => {
    const { openMaps, maps } = page();
    expect(openMaps).not.toHaveBeenCalled();
    expect(maps()).toBe("off");
  });

  it("opens the maps for the whole site from a placeholder's button", () => {
    const { openMaps, maps, grant, store } = page();
    grant.click();
    expect(openMaps).toHaveBeenCalledOnce();
    expect(store.isGranted()).toBe(true);
    expect(maps()).toBe("on");
  });

  it("marks the page on itself when consent was given before, whatever the head did", () => {
    const { openMaps, maps } = page({ granted: true, headRan: false });
    expect(openMaps).toHaveBeenCalledOnce();
    expect(maps()).toBe("on");
  });

  it("opens them at once when consent was given before", () => {
    const { openMaps, maps } = page({ granted: true });
    expect(openMaps).toHaveBeenCalledOnce();
    expect(maps()).toBe("on");
  });

  it("turns them on from the footer too", () => {
    const { openMaps, toggle, store } = page();
    toggle.click();
    expect(openMaps).toHaveBeenCalledOnce();
    expect(store.isGranted()).toBe(true);
  });

  it("turns them off from the footer by forgetting consent and reloading the page", () => {
    const { toggle, store, reload } = page({ granted: true });
    toggle.click();
    expect(store.isGranted()).toBe(false);
    expect(reload).toHaveBeenCalledOnce();
  });
});
