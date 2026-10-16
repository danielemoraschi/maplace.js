import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { MAPLACE_VERSION } from "./version";

it("is the package's version", () => {
  const manifest = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  expect(MAPLACE_VERSION).toBe(manifest.version);
});
