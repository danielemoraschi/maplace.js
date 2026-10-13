import { globSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { importsOf, layerOf, problemsIn } from "./imports.ts";

const SRC = "packages/maplace/src/";

describe("layerOf", () => {
  it("places each source file in its layer", () => {
    expect(layerOf("location")).toBe("data");
    expect(layerOf("adapter")).toBe("contract");
    expect(layerOf("element/google")).toBe("wiring");
    expect(layerOf("google/index")).toBe("google");
  });

  it("leaves unknown files out", () => {
    expect(layerOf("helpers")).toBeUndefined();
  });
});

describe("importsOf", () => {
  it("reads static, re-export, side-effect and dynamic imports", () => {
    const source = [
      'import type { A } from "./a";',
      'export { B } from "./b";',
      'import "./c";',
      'const d = await import("./d");',
    ].join("\n");
    expect(importsOf(source)).toEqual(["./a", "./b", "./c", "./d"]);
  });
});

describe("problemsIn", () => {
  it("accepts imports the layer allows", () => {
    expect(problemsIn("store.ts", 'import type { Adapter } from "./adapter";')).toEqual([]);
  });

  it("accepts imports within the same layer", () => {
    expect(problemsIn("google/index.ts", 'import { draw } from "./markers";')).toEqual([]);
  });

  it("accepts a directory import through its index", () => {
    expect(
      problemsIn("element/google.ts", 'import { createGoogleAdapter } from "../google";'),
    ).toEqual([]);
  });

  it("reports a view importing an adapter", () => {
    expect(problemsIn("list-view.ts", 'import "./google/index";')).toEqual([
      "list-view.ts: imports ./google/index (google); view may import data, store, state, validation",
    ]);
  });

  it("keeps the fake adapter at contract level; only the scenario helper sees the store", () => {
    expect(layerOf("testing/fake-adapter")).toBe("testing");
    expect(layerOf("testing/mounted")).toBe("scenario");
    const createStore = 'import { createMaplace } from "../maplace/create";';
    expect(problemsIn("testing/fake-adapter.ts", createStore)).toHaveLength(1);
    expect(problemsIn("testing/mounted.ts", createStore)).toEqual([]);
  });

  it("keeps views to the store's public API and pure state lookups", () => {
    expect(layerOf("views/listbox")).toBe("view");
    expect(layerOf("list-view")).toBe("view");
    expect(layerOf("list-views")).toBeUndefined();
    expect(
      problemsIn("views/listbox.ts", 'import { attach } from "../maplace/attachment";'),
    ).toHaveLength(1);
    expect(
      problemsIn("views/model.ts", 'import { diffLocations } from "../diff/locations";'),
    ).toHaveLength(1);
  });

  it("reports a data module importing the store", () => {
    expect(problemsIn("route.ts", 'import type { Maplace } from "./store";')).toHaveLength(1);
  });

  it("reports a file in no layer", () => {
    expect(problemsIn("helpers.ts", "")).toEqual([
      "helpers.ts: in no layer; add it to LAYERS in scripts/checks/imports.ts",
    ]);
  });

  it("reports an import outside every layer", () => {
    expect(problemsIn("store.ts", 'import "../../outside";')).toHaveLength(1);
  });

  it("accepts only the packages a layer may use", () => {
    expect(problemsIn("react/index.ts", 'import type { ReactNode } from "react";')).toEqual([]);
    expect(problemsIn("react/index.ts", 'import { jsx } from "react/jsx-runtime";')).toEqual([]);
    expect(problemsIn("store.ts", 'import { produce } from "immer";')).toEqual([
      "store.ts: imports package immer; store may use none",
    ]);
  });
});

describe("views and the state layer", () => {
  it("take only the pure lookups and the safety net from state", () => {
    const allowed = new Set(["lookup", "safely"]);
    const files = globSync("{list-view.ts,views/*.ts}", { cwd: SRC, exclude: ["**/*.test.ts"] });
    const reached = files.flatMap((file) =>
      importsOf(readFileSync(SRC + file, "utf8"))
        .filter((specifier) => specifier.includes("state/"))
        .map((specifier) => `${file} → ${specifier}`),
    );
    expect(reached.length).toBeGreaterThan(0);
    expect(reached.filter((line) => !allowed.has(line.split("state/")[1] ?? ""))).toEqual([]);
  });
});
