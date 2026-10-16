import { expect, it } from "vitest";

it("fails to load, naming the script that clusters", async () => {
  await expect(import("./clustering-left-out")).rejects.toMatchObject({
    code: "provider-load-failed",
    message: expect.stringContaining("maplace-element-cluster.iife.js"),
  });
});
