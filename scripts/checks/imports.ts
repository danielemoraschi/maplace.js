import { globSync, readFileSync } from "node:fs";
import { posix } from "node:path";
import { captures } from "../docs/markdown.ts";

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
  // The data types, and pure helpers on them that every layer may share.
  data: {
    files:
      /^(geometry|style|location|location-state|location-index|longitude-arc|options|route|viewport|popup|drawable|errors|events|adopted-styles|unstyled)$/,
  },
  validation: { files: /^validate\//, imports: ["data"] },
  diff: { files: /^diff\//, imports: ["data", "contract", "validation"] },
  state: { files: /^state\//, imports: ["data", "store", "validation", "diff"] },
  contract: { files: /^adapter$/, imports: ["data"] },
  store: { files: /^store$/, imports: ["data", "contract"] },
  // What every adapter draws with: diffs queued and worked in chunks, looks and the stacking rank,
  // clicks and hover told apart, the popup session, the view follower.
  "adapter-kit": { files: /^adapter-kit\//, imports: ["data", "contract"] },
  maplace: {
    files: /^maplace\//,
    imports: ["data", "contract", "store", "state", "diff", "validation"],
  },
  // Test support at contract level (the probe's types, the recorder); only the scenario helper
  // sees the composed store.
  testing: {
    files: /^testing\/(?!(mounted|listed|lists|fake-adapter)$|fake\/|conformance\/|examples\/)/,
    imports: ["data", "contract", "adapter-kit"],
  },
  // The fake adapter: an in-memory map, at contract level like any adapter.
  fake: {
    files: /^testing\/(fake-adapter$|fake\/)/,
    imports: ["data", "contract", "adapter-kit", "testing"],
  },
  // The conformance suite (T9) never sees the fake, so no check can lean on one adapter's code.
  conformance: {
    files: /^testing\/conformance\//,
    imports: ["data", "contract", "adapter-kit", "testing"],
    packages: ["vitest"],
  },
  // Ready stores on the fake, and a list view beside one (which cleans up after its test).
  scenario: {
    files: /^testing\/(mounted|listed)$/,
    imports: ["data", "contract", "maplace", "testing", "fake", "view"],
    packages: ["vitest"],
  },
  // Running the examples as readers copy them: the HTML around them, the stores they make (T5),
  // what each does on its fake map (W13), read through the fake's types and looks, and
  // maplace/google on the fake (A9).
  examples: {
    files: /^testing\/examples\//,
    imports: ["data", "testing", "entry", "element", "fake", "adapter-kit", "google-entry"],
    packages: ["vitest"],
  },
  // Test support for the list views: plain data and the view's own types.
  "list-testing": { files: /^testing\/lists$/, imports: ["data", "view"] },
  view: { files: /^(list-view$|views\/)/, imports: ["data", "store", "state", "validation"] },
  entry: { files: /^index$/, imports: ["data", "contract", "store", "view", "maplace"] },
  // The element makes stores and list views through the core's entry, as a page does; it reads
  // the data rules, and the adapter contract, store and list view for their types and constants.
  element: {
    files: /^element\/(?!google(-|$)|testing\/)/,
    imports: ["data", "contract", "store", "view", "entry"],
  },
  // The element's test support: maps on the fake adapter.
  "element-testing": {
    files: /^element\/testing\//,
    imports: ["data", "contract", "adapter-kit", "entry", "element", "fake"],
    packages: ["vitest"],
  },
  // The element's Google provider checks its attributes with the store's checks, so its misuse
  // reads the same.
  wiring: {
    files: /^element\/google(-[a-z-]+)?$/,
    imports: ["data", "contract", "element", "google", "validation"],
  },
  // The React binding makes stores and list views through the entry, as the element does, and
  // reads the shared data rules, the store's equality and icon rules, the list view's own helpers
  // (option naming, structure) and the store's messages for the page's code failing directly.
  react: {
    files: /^react\/(?!testing\/)/,
    imports: ["data", "contract", "store", "view", "entry", "diff", "validation"],
    packages: ["react", "react-dom"],
  },
  // The binding's test support: rendering into a root that collects what error boundaries catch.
  "react-testing": {
    files: /^react\/testing\//,
    imports: ["data", "contract", "entry", "react", "testing", "fake"],
    packages: ["react", "react-dom", "vitest"],
  },
  // A store on a provider's map in one call, with its list (A9): what each provider's shortcut
  // makes, through the core's entry, as React does.
  shortcut: {
    files: /^shortcut\//,
    imports: ["data", "contract", "entry", "validation"],
  },
  // Shares the store's option checks, so its misuse reads the same.
  google: {
    files: /^google\/(?!testing\/|index$|google-map(-options)?$)/,
    imports: ["data", "contract", "adapter-kit", "validation"],
    packages: ["@googlemaps/markerclusterer"],
  },
  // maplace/google: the adapter, and a store on a Google map in one call (A9), which uses the
  // core through its entry, as React does.
  "google-entry": {
    files: /^google\/(index|google-map(-options)?)$/,
    imports: ["data", "contract", "entry", "google", "shortcut"],
  },
  // The Google adapter's test support: its probe and the Maps JS loader for tests.
  "google-testing": {
    files: /^google\/testing\//,
    imports: ["data", "contract", "adapter-kit", "testing", "conformance", "google"],
    packages: ["vitest"],
  },
  // The MapLibre adapter: maplibre-gl itself is loaded on mount, its types imported anywhere here;
  // supercluster by the clustering, loaded only by a map that clusters.
  maplibre: {
    files: /^maplibre\/(?!testing\/|index$|maplibre-map(-options)?$)/,
    imports: ["data", "contract", "adapter-kit", "validation"],
    packages: ["maplibre-gl", "supercluster"],
  },
  // maplace/maplibre: the adapter, and a store on a MapLibre map in one call.
  "maplibre-entry": {
    files: /^maplibre\/(index|maplibre-map(-options)?)$/,
    imports: ["data", "contract", "entry", "maplibre", "shortcut", "validation"],
    packages: ["maplibre-gl"],
  },
  // The MapLibre adapter's test support: its probe, a local style and MapLibre's stylesheet.
  "maplibre-testing": {
    files: /^maplibre\/testing\//,
    imports: ["data", "contract", "adapter-kit", "testing", "conformance", "maplibre"],
    packages: ["maplibre-gl", "vitest"],
  },
} satisfies Record<string, LayerRule>;

type Layer = keyof typeof LAYERS;

const RULES: Readonly<Record<Layer, LayerRule>> = LAYERS;

// The quoted specifier after `from`, `import` or `import(`: every static and dynamic form.
// The keyword counts only on its own, not after a quote, a dot or part of a name: a string like
// "from" or a call like loader.import("x") isn't read as an import. Text that reads like one (an
// example in a comment, a message with ` from "x"`) still counts: it fails loudly, never silently.
const IMPORT_SPECIFIER = /(?<![\w$.'"`])(?:from|import)\s*(?:\(\s*)?["']([^"']+)["']/g;

/** Imports that cross a layer boundary or reach for a package the layer may not use (T10); tests may import anything. */
export function check(): string[] {
  return globSync("**/*.{ts,tsx}", {
    cwd: SRC,
    exclude: ["__typetests__/**", "**/*.test.{ts,tsx}"],
  })
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
  return captures(source, IMPORT_SPECIFIER);
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
export function packageName(specifier: string): string {
  const parts = specifier.split("/");
  return parts.slice(0, specifier.startsWith("@") ? 2 : 1).join("/");
}

function withoutExtension(path: string): string {
  return path.replace(/\.(tsx?|js)$/, "");
}
