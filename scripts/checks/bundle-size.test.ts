import type { Metafile } from "esbuild";
import { describe, expect, it } from "vitest";
import { reachableOutputs } from "./bundle-size.ts";

type Imports = Metafile["outputs"][string]["imports"];

function output(imports: Imports, entryPoint?: string): Metafile["outputs"][string] {
  return { imports, exports: [], inputs: {}, bytes: 0, ...(entryPoint && { entryPoint }) };
}

/** Two entries sharing a chunk; the second imports a lazy chunk on demand. */
const METAFILE: Metafile = {
  inputs: {},
  outputs: {
    "out/core.js": output([{ path: "out/shared.js", kind: "import-statement" }], "src/core.ts"),
    "out/google.js": output(
      [
        { path: "out/shared.js", kind: "import-statement" },
        { path: "out/lazy.js", kind: "dynamic-import" },
      ],
      "src/google.ts",
    ),
    "out/shared.js": output([]),
    "out/lazy.js": output([{ path: "out/shared.js", kind: "import-statement" }]),
  },
};

describe("reachableOutputs", () => {
  it("follows static imports into shared chunks", () => {
    expect(reachableOutputs(METAFILE, "src/core.ts", { dynamic: false })).toEqual(
      new Set(["out/core.js", "out/shared.js"]),
    );
  });

  it("leaves chunks imported on demand out, unless asked", () => {
    expect(reachableOutputs(METAFILE, "src/google.ts", { dynamic: false })).toEqual(
      new Set(["out/google.js", "out/shared.js"]),
    );
    expect(reachableOutputs(METAFILE, "src/google.ts", { dynamic: true })).toEqual(
      new Set(["out/google.js", "out/shared.js", "out/lazy.js"]),
    );
  });

  it("refuses an entry the bundle doesn't have", () => {
    expect(() => reachableOutputs(METAFILE, "src/none.ts", { dynamic: false })).toThrow(
      /no output/,
    );
  });
});
