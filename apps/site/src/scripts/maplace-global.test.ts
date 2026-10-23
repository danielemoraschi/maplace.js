import { describe, expect, it, vi } from "vitest";
import { maplaceInstaller } from "./maplace-global.ts";

const createGoogleMap = () => {};
const createMapLibreMap = () => {};

function imports() {
  return {
    google: vi.fn(async () => ({ createGoogleMap })),
    maplibre: vi.fn(async () => ({ createMapLibreMap })),
  };
}

describe("maplaceInstaller", () => {
  it("puts each provider's entries on the page's Maplace, keeping what another provider's put there", async () => {
    const page: { Maplace?: object } = {};
    const install = maplaceInstaller(imports(), page);
    await install("google");
    await install("maplibre");
    expect(page.Maplace).toEqual({ createGoogleMap, createMapLibreMap });
  });

  it("fails with the import, leaving the page's Maplace as it was", async () => {
    const loads = imports();
    loads.google.mockRejectedValueOnce(new Error("offline"));
    const page: { Maplace?: object } = {};
    await expect(maplaceInstaller(loads, page)("google")).rejects.toThrow("offline");
    expect(page.Maplace).toBeUndefined();
  });
});
