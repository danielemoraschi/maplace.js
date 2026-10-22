import type { BuildOptions } from "esbuild";
import { type CdnScript, cdnBuildOptions, ownCodeBuildOptions } from "../build/cdn-builds.ts";
import { esmBuildOptions } from "../build/esm-build.ts";
import { PACKAGE_ENTRIES } from "../build/package.ts";
import { gzipKilobytes } from "./bundle-size.ts";
import { type Bundle, bundleInMemory, reachableOutputs, scriptsOf } from "./in-memory-bundle.ts";
import { missingFrom } from "./lists.ts";
import { RFC } from "./rfc.ts";
import { rfcBudgets } from "./rfc-numbers.ts";

/**
 * How one budget of RFC §3 Numbers is measured, on the builds `npm run build` makes: what a page
 * loads for an npm `entry`, less what it shares with `beside`; a CDN script as served; or
 * maplace's own code in one, without the packages it bundles.
 */
export type SizeMeasure = {
  readonly name: string;
  /** The budget's row in the RFC's Numbers table, its first cell exactly. */
  readonly rfcRow: string;
} & (
  | { readonly kind: "esm"; readonly entry: string; readonly beside?: string }
  | { readonly kind: "cdn" | "cdn-own"; readonly script: CdnScript }
);

export const SIZE_MEASURES: readonly SizeMeasure[] = [
  { name: "maplace", rfcRow: "Core (`maplace`)", kind: "esm", entry: PACKAGE_ENTRIES.core },
  {
    name: "maplace/google",
    rfcRow: "Google adapter (`maplace/google`)",
    kind: "esm",
    entry: PACKAGE_ENTRIES.google,
    beside: PACKAGE_ENTRIES.core,
  },
  {
    name: "maplace/maplibre",
    rfcRow: "MapLibre adapter (`maplace/maplibre`)",
    kind: "esm",
    entry: PACKAGE_ENTRIES.maplibre,
    beside: PACKAGE_ENTRIES.core,
  },
  {
    name: "maplace/react",
    rfcRow: "React binding (`maplace/react`)",
    kind: "esm",
    entry: PACKAGE_ENTRIES.react,
    beside: PACKAGE_ENTRIES.core,
  },
  {
    name: "element CDN",
    rfcRow: "Element CDN build (core + Google + list view + element)",
    kind: "cdn",
    script: "plain",
  },
  {
    name: "element CDN with clustering",
    rfcRow: "Element CDN build with clustering",
    kind: "cdn",
    script: "cluster",
  },
  {
    name: "element CDN on MapLibre",
    rfcRow: "Element CDN build on MapLibre (core + MapLibre + list view + element)",
    kind: "cdn-own",
    script: "maplibre",
  },
  {
    name: "element CDN on MapLibre, as served",
    rfcRow:
      "Element CDN build on MapLibre, as served (maplibre-gl, its worker and stylesheet bundled)",
    kind: "cdn",
    script: "maplibre",
  },
];

export interface Measurement {
  readonly measure: SizeMeasure;
  /** gzip, in kB of 1,000 bytes. */
  readonly kilobytes: number;
}

/** Every budget measured on the package's builds, made in memory and minified. */
export async function measureSizes(): Promise<Measurement[]> {
  const esm = bundleInMemory(esmBuildOptions());
  return Promise.all(
    SIZE_MEASURES.map(async (measure) => {
      if (measure.kind === "esm") {
        const bundle = await esm;
        return { measure, kilobytes: gzipKilobytes(bundle, loadedBy(bundle, measure)) };
      }
      const script = await bundleInMemory(cdnScriptBuildOptions(measure));
      return { measure, kilobytes: gzipKilobytes(script, scriptsOf(script)) };
    }),
  );
}

/** A CDN measure's build: the script as served, or maplace's own code in it. */
function cdnScriptBuildOptions({ kind, script }: CdnMeasure): BuildOptions {
  return kind === "cdn" ? cdnBuildOptions(script) : ownCodeBuildOptions(script);
}

/** Each entry over its RFC budget, and each budget measured or written in one place only. */
export async function check(
  measured?: readonly Measurement[],
  budgets: ReadonlyMap<string, number> = rfcBudgets(),
): Promise<string[]> {
  const measurements = measured ?? (await measureSizes());
  const rows = measurements.map(({ measure }) => measure.rfcRow);
  return [
    ...missingFrom([...budgets.keys()], rows).map((row) => `${row} has no budget in ${RFC}`),
    ...missingFrom(rows, [...budgets.keys()]).map((row) => `${row} in ${RFC} is never measured`),
    ...measurements.flatMap(({ measure, kilobytes }) => {
      const budget = budgets.get(measure.rfcRow);
      if (budget === undefined || kilobytes <= budget) return [];
      return [`${measure.name} is ${kilobytes.toFixed(2)} kB gzip, over its ${budget} kB budget`];
    }),
  ];
}

type EsmMeasure = Extract<SizeMeasure, { kind: "esm" }>;
type CdnMeasure = Exclude<SizeMeasure, EsmMeasure>;

function loadedBy(esm: Bundle, { entry, beside }: EsmMeasure): string[] {
  const loaded = reachableOutputs(esm.metafile, entry);
  if (beside === undefined) return [...loaded];
  const already = reachableOutputs(esm.metafile, beside);
  return [...loaded].filter((path) => !already.has(path));
}
