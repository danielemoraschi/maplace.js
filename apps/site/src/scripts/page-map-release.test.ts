// @vitest-environment happy-dom
import type { MaplaceMapElement } from "maplace/element";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { INERT_SCRIPT_TYPE } from "../examples/page-scripts.ts";
import { pageMapRelease } from "./page-map-release.ts";

const released: string[] = [];

function frame(provider: string, id: string): string {
  return `<div class="map-frame">
    <div data-live-version="html" data-provider="${provider}" data-live-page>
      <maplace-map hold id="${id}"></maplace-map>
      <script type="${INERT_SCRIPT_TYPE}">window.ran = true;</script>
    </div>
    <p data-map-failure></p>
  </div>`;
}

function map(id: string): MaplaceMapElement {
  const element = document.getElementById(id) as MaplaceMapElement;
  element.release = () => released.push(id);
  return element;
}

function loaders(google = vi.fn(async () => {})) {
  return { google, maplibre: vi.fn(async () => {}) };
}

beforeEach(() => {
  released.length = 0;
  document.body.innerHTML =
    frame("google", "rome") + frame("google", "milan") + frame("maplibre", "lisbon");
});

describe("pageMapRelease", () => {
  it("releases a Google map once Google's element loaded, a MapLibre map once MapLibre's", async () => {
    const load = loaders();
    const release = pageMapRelease(load);
    await release(map("rome"));
    expect(load.google).toHaveBeenCalledOnce();
    expect(load.maplibre).not.toHaveBeenCalled();
    await release(map("lisbon"));
    expect(load.maplibre).toHaveBeenCalledOnce();
    expect(released).toEqual(["rome", "lisbon"]);
  });

  it("loads each provider's element once for many maps", async () => {
    const load = loaders();
    const release = pageMapRelease(load);
    await Promise.all([release(map("rome")), release(map("milan"))]);
    expect(load.google).toHaveBeenCalledOnce();
    expect(released).toEqual(["rome", "milan"]);
  });

  it("notes a failed load for that map and releases it with the next success", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const google = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue();
    const release = pageMapRelease(loaders(google));
    const rome = map("rome");
    await release(rome);
    expect(rome.closest("[data-live-version]")?.hasAttribute("data-failed")).toBe(true);
    await release(map("milan"));
    expect(released).toEqual(["rome", "milan"]);
    expect(rome.closest("[data-live-version]")?.hasAttribute("data-failed")).toBe(false);
  });

  it("runs the page's scripts as its map is released", async () => {
    await pageMapRelease(loaders())(map("rome"));
    const page = document.getElementById("rome")?.closest("[data-live-page]");
    expect(page?.querySelector(`script[type="${INERT_SCRIPT_TYPE}"]`)).toBeNull();
    expect(page?.querySelector("script")?.textContent).toBe("window.ran = true;");
  });
});
