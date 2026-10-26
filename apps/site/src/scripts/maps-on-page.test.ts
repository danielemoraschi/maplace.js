// @vitest-environment happy-dom
// @vitest-environment-options { "settings": { "handleDisabledFileLoadingAsSuccess": true } }
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { askBootstrapForMapsJs, mapsJsOnPage, watchMapsJs } from "./maps-on-page.ts";

const MAPS_JS = "https://maps.googleapis.com/maps/api/js?key=k&callback=x";

function mapsTag(): HTMLScriptElement {
  const script = document.createElement("script");
  script.setAttribute("src", MAPS_JS);
  return script;
}

const defineImportLibrary = (importLibrary = () => Promise.resolve({})) =>
  vi.stubGlobal("google", { maps: { importLibrary } });

const failLoading = (script: HTMLScriptElement) => script.dispatchEvent(new Event("error"));

beforeEach(() => {
  document.head.replaceChildren();
  document.body.replaceChildren();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("mapsJsOnPage", () => {
  it("is false on a page with neither a Maps tag nor importLibrary", () => {
    expect(mapsJsOnPage(document)).toBe(false);
  });

  it("is true with a Maps tag, whoever added it", () => {
    document.head.append(mapsTag());
    expect(mapsJsOnPage(document)).toBe(true);
  });

  it("is true with importLibrary defined, as a bootstrap or js-api-loader leaves it", () => {
    defineImportLibrary();
    expect(mapsJsOnPage(document)).toBe(true);
  });
});

describe("watchMapsJs", () => {
  it("is importable once importLibrary appears, one wait for every caller", async () => {
    vi.useFakeTimers();
    const watcher = watchMapsJs(document);
    const importable = watcher.importable();
    expect(watcher.importable()).toBe(importable);
    defineImportLibrary();
    await vi.advanceTimersByTimeAsync(50);
    await expect(importable).resolves.toBeUndefined();
  });

  it("fails when a Maps tag failed before it was asked", async () => {
    const watcher = watchMapsJs(document);
    const tag = mapsTag();
    document.head.append(tag);
    failLoading(tag);
    await expect(watcher.importable()).rejects.toThrow(/Maps JS/);
  });

  it("fails when a Maps tag fails while it waits", async () => {
    vi.useFakeTimers();
    const watcher = watchMapsJs(document);
    const importable = watcher.importable();
    const failed = expect(importable).rejects.toThrow(/Maps JS/);
    const tag = mapsTag();
    document.head.append(tag);
    failLoading(tag);
    await vi.advanceTimersByTimeAsync(50);
    await failed;
  });

  it("tells its listeners when a Maps tag fails, after a wait already resolved", () => {
    const watcher = watchMapsJs(document);
    const failures = vi.fn();
    watcher.whenFailed(failures);
    const tag = mapsTag();
    document.head.append(tag);
    failLoading(tag);
    expect(failures).toHaveBeenCalledOnce();
  });

  it("leaves other scripts' failures alone", async () => {
    vi.useFakeTimers();
    const watcher = watchMapsJs(document);
    const other = document.createElement("script");
    other.setAttribute("src", "/other.js");
    document.head.append(other);
    failLoading(other);
    const importable = watcher.importable();
    defineImportLibrary();
    await vi.advanceTimersByTimeAsync(50);
    await expect(importable).resolves.toBeUndefined();
  });
});

describe("askBootstrapForMapsJs", () => {
  it("asks the bootstrap for the adapter's libraries together", () => {
    const importLibrary = vi.fn(async () => ({}));
    defineImportLibrary(importLibrary);
    askBootstrapForMapsJs();
    expect(importLibrary.mock.calls).toEqual([["core"], ["maps"], ["marker"]]);
  });

  // A rejection left unhandled would fail the run.
  it("leaves a failed ask to the version's map", async () => {
    defineImportLibrary(() => Promise.reject(new Error("no Maps JS")));
    expect(() => askBootstrapForMapsJs()).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve));
  });

  it("asks nothing without a bootstrap", async () => {
    expect(() => askBootstrapForMapsJs()).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve));
  });
});
