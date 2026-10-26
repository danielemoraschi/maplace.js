import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { buildPackage } from "../build/build-package.ts";
import { packTarball } from "../build/pack-tarball.ts";
import { ROOT } from "../build/package.ts";
import { tempDir } from "../build/temp-dir.ts";
import { layOutConsumer, typeCheckConsumer } from "./consumer-types.ts";
import { packageLintProblems } from "./package-lint.ts";
import { renderServerComponentsApp } from "./server-components.ts";
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

  it("type-checks for a strict consumer without Google, MapLibre, React, Vue or Svelte, who needs none's types", () => {
    const { errors, loadedFiles } = typeCheckConsumer(consumerDir, "core-and-element");
    expect(errors).toEqual([]);
    const typesNotNeeded = /\/(@types\/(google\.maps|react)|maplibre-gl|vue|@vue|svelte)\//;
    expect(loadedFiles.filter((file) => typesNotNeeded.test(file))).toEqual([]);
  }, 30_000);

  it("ships the element's Vue and Svelte template types with its declarations", () => {
    const declarations = (file: string) =>
      readFileSync(join(stagedDir, "dist/element", file), "utf8");
    expect(declarations("index.d.ts")).toContain('import "./framework-types.js";');
    expect(declarations("framework-types.d.ts")).toMatch(
      /declare module "vue".*declare module "svelte\/elements"/s,
    );
  });

  it("type-checks for a strict consumer in React", () => {
    const { errors, loadedFiles } = typeCheckConsumer(consumerDir, "react");
    expect(errors).toEqual([]);
    expect(loadedFiles.some((file) => file.includes("/@types/react/"))).toBe(true);
  }, 30_000);

  it("renders in a React Server Components app, its binding a client boundary", () => {
    const render = renderServerComponentsApp(stagedDir);
    expect(render.serverRefersToBinding).toBe(true);
    expect(render.clientHoldsBinding).toBe(true);
    expect(render.html).toContain('<div class="map"></div>');
    expect(render.html).toContain('<div style="display:contents"></div>');
    expect(render.payload).toContain('"title":"Rome"');
  }, 120_000);

  it("type-checks for a strict consumer on Google, its types reached through maplace's", () => {
    const { errors, loadedFiles } = typeCheckConsumer(consumerDir, "google");
    expect(errors).toEqual([]);
    expect(loadedFiles.some((file) => file.includes("/@types/google.maps/"))).toBe(true);
  }, 30_000);

  it("type-checks for a strict consumer on MapLibre, with the maplibre-gl it installed", () => {
    const { errors, loadedFiles } = typeCheckConsumer(consumerDir, "maplibre");
    expect(errors).toEqual([]);
    expect(loadedFiles.some((file) => file.includes("/maplibre-gl/"))).toBe(true);
  }, 30_000);
});
