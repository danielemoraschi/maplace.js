import { describe, expect, it } from "vitest";
import { elementLoaders, type ProviderImports } from "./provider-loaders.ts";

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
