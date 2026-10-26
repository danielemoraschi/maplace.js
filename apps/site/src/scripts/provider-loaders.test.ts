import { describe, expect, it, vi } from "vitest";
import { elementLoaders, mapLibreVersionReady, type ProviderImports } from "./provider-loaders.ts";

function stubImports() {
  const steps: string[] = [];
  const imports: ProviderImports = {
    google: async () => steps.push("google's element"),
    maplibre: async () => steps.push("maplibre's element"),
    mapLibreAssets: async () => {
      steps.push("maplibre's assets");
      return { useBuiltWorker: () => steps.push("built worker used") };
    },
  };
  return { imports, steps };
}

describe("elementLoaders", () => {
  it("resolves MapLibre's element only once its worker is readied", async () => {
    const { imports, steps } = stubImports();
    let assetsArrive: () => void = () => {};
    const assets = imports.mapLibreAssets;
    const held: ProviderImports = {
      ...imports,
      mapLibreAssets: () =>
        new Promise<void>((resolve) => {
          assetsArrive = resolve;
        }).then(assets),
    };
    let loaded = false;
    const loading = elementLoaders(held)
      .maplibre()
      .then(() => {
        loaded = true;
      });
    await new Promise((resolve) => setTimeout(resolve));
    expect(loaded).toBe(false);
    assetsArrive();
    await loading;
    expect(steps).toContain("built worker used");
  });

  it("loads Google's element without MapLibre's assets", async () => {
    const { imports, steps } = stubImports();
    await elementLoaders(imports).google();
    expect(steps).toEqual(["google's element"]);
  });
});

describe("mapLibreVersionReady", () => {
  it("readies a version at once, maplibre-gl asked for and not waited for", async () => {
    const loadMapLibreGl = vi.fn(() => new Promise(() => {}));
    await expect(mapLibreVersionReady(loadMapLibreGl)()).resolves.toBeUndefined();
    expect(loadMapLibreGl).toHaveBeenCalledOnce();
  });

  // A rejection left unhandled would fail the run.
  it("leaves a maplibre-gl that failed to the version's map", async () => {
    const failed = () => Promise.reject(new Error("maplibre-gl didn't load"));
    await expect(mapLibreVersionReady(failed)()).resolves.toBeUndefined();
  });
});
