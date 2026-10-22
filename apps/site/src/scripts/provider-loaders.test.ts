import { describe, expect, it } from "vitest";
import { type ProviderImports, providerLoaders } from "./provider-loaders.ts";

function stubImports(assetsFail = false) {
  const steps: string[] = [];
  const imports: ProviderImports = {
    google: async () => steps.push("google's element"),
    maplibre: async () => steps.push("maplibre's element"),
    mapLibreAssets: async () => {
      steps.push("maplibre's assets");
      if (assetsFail) throw new Error("offline");
      return { useBuiltWorker: () => steps.push("built worker used") };
    },
  };
  return { imports, steps };
}

describe("providerLoaders", () => {
  it("loads MapLibre's element only once its worker is readied", async () => {
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
    const loading = providerLoaders(held)
      .elementLoaders.maplibre()
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
    await providerLoaders(imports).elementLoaders.google();
    expect(steps).toEqual(["google's element"]);
  });

  it("readies MapLibre once, for its element and every version", async () => {
    const { imports, steps } = stubImports();
    const { readyMapLibre, elementLoaders } = providerLoaders(imports);
    await Promise.all([readyMapLibre(), elementLoaders.maplibre(), readyMapLibre()]);
    expect(steps.filter((step) => step === "built worker used")).toHaveLength(1);
  });

  it("tries readying MapLibre again after a failure", async () => {
    const { imports, steps } = stubImports(true);
    const { readyMapLibre } = providerLoaders(imports);
    await expect(readyMapLibre()).rejects.toThrow("offline");
    await expect(readyMapLibre()).rejects.toThrow("offline");
    expect(steps).toEqual(["maplibre's assets", "maplibre's assets"]);
  });
});
