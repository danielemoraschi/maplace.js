import type { Metafile } from "esbuild";
import { describe, expect, it } from "vitest";
import { reachableOutputs } from "./in-memory-bundle.ts";

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
    expect(reachableOutputs(METAFILE, "src/core.ts")).toEqual(
      new Set(["out/core.js", "out/shared.js"]),
    );
  });

  it("leaves chunks imported on demand out", () => {
    expect(reachableOutputs(METAFILE, "src/google.ts")).toEqual(
      new Set(["out/google.js", "out/shared.js"]),
    );
  });

  it("leaves out the packages it imports, which aren't outputs", () => {
    const metafile: Metafile = {
      inputs: {},
      outputs: {
        "out/react.js": output(
          [{ path: "react/jsx-runtime", kind: "import-statement", external: true }],
          "src/react.ts",
        ),
      },
    };
    expect(reachableOutputs(metafile, "src/react.ts")).toEqual(new Set(["out/react.js"]));
  });

  it("refuses an entry the bundle doesn't have", () => {
    expect(() => reachableOutputs(METAFILE, "src/none.ts")).toThrow(/no output/);
  });
});
