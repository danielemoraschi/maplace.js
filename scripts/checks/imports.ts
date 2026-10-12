import { globSync, readFileSync } from "node:fs";
import { posix } from "node:path";

const SRC = "packages/maplace/src/";

/** A layer's files (module paths under src, without extension), and what they may use. */
interface LayerRule {
  readonly files: RegExp;
  /** Other layers this one may import; its own files are always allowed. */
  readonly imports?: readonly string[];
  readonly packages?: readonly string[];
}

/** The layers of src. `google.maps` itself is fenced by Biome (`noRestrictedGlobals`). */
const LAYERS = {
  data: {
    files: /^(geometry|style|location|options|route|viewport|popup|drawable|errors|events)$/,
  },
  validation: { files: /^validate\//, imports: ["data"] },
  diff: { files: /^diff\//, imports: ["data", "contract"] },
  state: { files: /^state\//, imports: ["data", "store", "validation", "diff"] },
  contract: { files: /^adapter$/, imports: ["data"] },
  store: { files: /^store$/, imports: ["data", "contract"] },
  view: { files: /^list-view$/, imports: ["data", "store"] },
  entry: { files: /^index$/, imports: ["data", "contract", "store", "view"] },
  element: { files: /^element\/index$/, imports: ["data", "contract", "store", "view"] },
  wiring: { files: /^element\/google$/, imports: ["data", "contract", "element", "google"] },
  react: { files: /^react\//, imports: ["data", "contract", "store", "view"], packages: ["react"] },
  google: {
    files: /^google\//,
    imports: ["data", "contract"],
    packages: ["@googlemaps/markerclusterer"],
  },
} satisfies Record<string, LayerRule>;

type Layer = keyof typeof LAYERS;

const RULES: Readonly<Record<Layer, LayerRule>> = LAYERS;

// The quoted specifier after `from`, `import` or `import(`: every static and dynamic form.
const IMPORT_SPECIFIER = /\b(?:from|import)\s*(?:\(\s*)?["']([^"']+)["']/g;

/** Imports that cross a layer boundary or reach for a package the layer may not use (T10); tests may import anything. */
export function check(): string[] {
  return globSync("**/*.{ts,tsx}", { cwd: SRC, exclude: ["__typetests__/**", "**/*.test.ts"] })
    .flatMap((file) => problemsIn(file, readFileSync(SRC + file, "utf8")))
    .map((problem) => SRC + problem);
}

/** Problems in one source file; `file` is relative to src. */
export function problemsIn(file: string, source: string): string[] {
  const layer = layerOf(withoutExtension(file));
  if (layer === undefined) {
    return [`${file}: in no layer; add it to LAYERS in scripts/checks/imports.ts`];
  }
  return importsOf(source).flatMap((specifier) =>
    specifier.startsWith(".")
      ? layerProblems(file, layer, specifier)
      : packageProblems(file, layer, specifier),
  );
}

export function layerOf(module: string): Layer | undefined {
  return (Object.keys(RULES) as Layer[]).find((layer) => RULES[layer].files.test(module));
}

export function importsOf(source: string): string[] {
  return Array.from(source.matchAll(IMPORT_SPECIFIER), ([, specifier]) => specifier ?? "");
}

function layerProblems(file: string, layer: Layer, specifier: string): string[] {
  const importedLayer = layerOfImport(file, specifier);
  const allowed = RULES[layer].imports ?? [];
  if (importedLayer === layer || (importedLayer && allowed.includes(importedLayer))) return [];
  return [
    `${file}: imports ${specifier} (${importedLayer ?? "no layer"}); ` +
      `${layer} may import ${allowed.join(", ") || "nothing else"}`,
  ];
}

/** The layer of a relative import, which may name a file or a directory's index. */
function layerOfImport(file: string, specifier: string): Layer | undefined {
  const target = withoutExtension(posix.join(posix.dirname(file), specifier));
  return layerOf(target) ?? layerOf(`${target}/index`);
}

function packageProblems(file: string, layer: Layer, specifier: string): string[] {
  const name = packageName(specifier);
  const allowed = RULES[layer].packages ?? [];
  if (allowed.includes(name)) return [];
  return [`${file}: imports package ${name}; ${layer} may use ${allowed.join(", ") || "none"}`];
}

/** `react/jsx-runtime` → `react`, `@scope/name/sub` → `@scope/name`. */
function packageName(specifier: string): string {
  const parts = specifier.split("/");
  return parts.slice(0, specifier.startsWith("@") ? 2 : 1).join("/");
}

function withoutExtension(path: string): string {
  return path.replace(/\.(tsx?|js)$/, "");
}
