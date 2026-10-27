// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { startConsent } from "./consent-controls.ts";
import { createConsentStore } from "./consent-store.ts";

/**
 * A page of its own, as the head's script leaves it: `data-maps` set from the kept consent. Its
 * own document, as `startConsent` listens on the document for good.
 */
function page({ granted = false, headRan = true } = {}) {
  const doc = document.implementation.createHTMLDocument();
  doc.documentElement.dataset.maps = granted && headRan ? "on" : "off";
  doc.body.innerHTML = `
    <button data-maps-grant>Load maps</button>
    <footer><button data-maps-toggle></button></footer>`;
  const store = createConsentStore(() => localStorage);
  if (granted) store.grant();
  const openMaps = vi.fn();
  const reload = vi.fn();
  startConsent({ document: doc, store, openMaps, reload });
  const grant = doc.querySelector("[data-maps-grant]") as HTMLButtonElement;
  const toggle = doc.querySelector("[data-maps-toggle]") as HTMLButtonElement;
  return {
    doc,
    store,
    openMaps,
    reload,
    grant,
    toggle,
    maps: () => doc.documentElement.dataset.maps,
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

  it.each([
    { headRan: true, head: "the head's script marked it" },
    { headRan: false, head: "the head's script didn't run" },
  ])("opens them at once when consent was given before, marking the page: $head", ({ headRan }) => {
    const { openMaps, maps } = page({ granted: true, headRan });
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

  it("opens the maps from a placeholder added after it started, a group's panel fetched later", () => {
    const { doc, openMaps, store } = page();
    const later = doc.createElement("div");
    later.innerHTML = "<p><button data-maps-grant>Load maps</button></p>";
    doc.body.append(later);
    later.querySelector("button")?.click();
    expect(openMaps).toHaveBeenCalledOnce();
    expect(store.isGranted()).toBe(true);
  });

  it("turns the maps off once for one click, with the page's buttons outnumbering it", () => {
    const { doc, toggle, store, reload } = page({ granted: true });
    doc.body.insertAdjacentHTML("beforeend", "<button data-maps-grant>Load maps</button>");
    toggle.click();
    expect(store.isGranted()).toBe(false);
    expect(reload).toHaveBeenCalledOnce();
  });
});
