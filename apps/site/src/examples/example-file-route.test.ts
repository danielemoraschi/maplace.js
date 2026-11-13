import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { servedExampleFiles } from "./example-data.ts";
import { exampleFilePaths } from "./example-file-route.ts";

/** The extensions with a route file, `[name].<extension>.ts`, under `pages/examples/[...folder]/`. */
const ROUTED_EXTENSIONS = readdirSync(
  new URL("../pages/examples/[...folder]/", import.meta.url),
).map((file) => file.split(".").at(-2) ?? file);

describe("exampleFilePaths", () => {
  it("is each file of the extension, by its folder and name", () => {
    expect(exampleFilePaths("svg").map(({ params }) => params)).toEqual([
      { folder: "data/icons", name: "a" },
      { folder: "data/icons", name: "b" },
      { folder: "data/icons", name: "c" },
    ]);
    expect(exampleFilePaths("css").map(({ params }) => params)).toEqual([
      { folder: "styles", name: "popups" },
      { folder: "styles", name: "whats-on" },
    ]);
    expect(exampleFilePaths("webp").map(({ params }) => params)).toEqual([
      { folder: "data/photos", name: "colosseum" },
      { folder: "data/photos", name: "duomo" },
      { folder: "data/photos", name: "st-marks" },
    ]);
  });

  it("covers every served file once, across the routes' extensions", () => {
    const routed = ROUTED_EXTENSIONS.flatMap((extension) =>
      exampleFilePaths(extension).map(({ params }) => params),
    );
    expect(routed).toHaveLength(servedExampleFiles().length);
  });

  it("has a route file named with each extension served, which a dev server needs", () => {
    const served = new Set(servedExampleFiles().map(({ path }) => path.split(".").at(-1)));
    expect([...served].sort()).toEqual([...ROUTED_EXTENSIONS].sort());
  });
});
