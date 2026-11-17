import { describe, expect, it } from "vitest";
import { loadOnDemand } from "./load-on-demand";

describe("loadOnDemand", () => {
  it("gives the module loaded", async () => {
    await expect(loadOnDemand("heatmap", async () => ({ part: 1 }))).resolves.toEqual({ part: 1 });
  });

  it("fails as provider-load-failed, naming the part and keeping the cause", async () => {
    const offline = new Error("offline");
    await expect(loadOnDemand("heatmap", () => Promise.reject(offline))).rejects.toMatchObject({
      code: "provider-load-failed",
      message: "mount: maplace's heatmap failed to load",
      cause: offline,
    });
  });
});
