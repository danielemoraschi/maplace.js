import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { buildPackage } from "../build/build-package.ts";
import { packTarball } from "../build/pack-tarball.ts";
import { ROOT } from "../build/package.ts";
import { tempDir } from "../build/temp-dir.ts";
import { layOutConsumer, typeCheckConsumer } from "./consumer-types.ts";
import { packageLintProblems } from "./package-lint.ts";
import { typeResolutionProblems } from "./type-resolution.ts";

/** Under the repo, so the consumer finds maplace's dependencies installed, as a page would. */
const consumerDir = tempDir("consumer", join(ROOT, "node_modules/.cache/maplace-checks"));
const workDir = tempDir("pack");
const stagedDir = join(consumerDir, "node_modules", "maplace");
let tarball: string;

beforeAll(async () => {
  await buildPackage({ dist: join(workDir, "dist"), packed: stagedDir });
  tarball = packTarball(stagedDir, workDir);
  layOutConsumer(consumerDir);
}, 60_000);

describe("the packed package", () => {
  it("has nothing publint warns about", async () => {
    expect(await packageLintProblems(tarball)).toEqual([]);
  });

  it("resolves every entry's types under every resolution an ES module package serves", async () => {
    expect(await typeResolutionProblems(tarball)).toEqual([]);
  }, 30_000);

  it("type-checks for a strict consumer without Google, who needs no Google types", () => {
    const { errors, loadedFiles } = typeCheckConsumer(consumerDir, "core-and-element");
    expect(errors).toEqual([]);
    expect(loadedFiles.filter((file) => file.includes("/@types/google.maps/"))).toEqual([]);
  }, 30_000);

  it("type-checks for a strict consumer on Google, its types reached through maplace's", () => {
    const { errors, loadedFiles } = typeCheckConsumer(consumerDir, "google");
    expect(errors).toEqual([]);
    expect(loadedFiles.some((file) => file.includes("/@types/google.maps/"))).toBe(true);
  }, 30_000);
});
