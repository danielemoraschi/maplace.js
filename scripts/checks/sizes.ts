import { type CdnScript, cdnBuildOptions } from "../build/cdn-builds.ts";
import { esmBuildOptions } from "../build/esm-build.ts";
import { PACKAGE_ENTRIES } from "../build/package.ts";
import {
  type Bundle,
  bundleInMemory,
  gzipKilobytes,
  reachableOutputs,
  scriptsOf,
} from "./bundle-size.ts";
import { missingFrom, RFC } from "./rfc.ts";
import { rfcBudgets } from "./rfc-numbers.ts";

/**
 * How one budget of RFC §3 Numbers is measured, on the builds `npm run build` makes: what a page
 * loads for an npm `entry`, less what it shares with `beside`; or a CDN script.
 */
export type SizeMeasure = {
  readonly name: string;
  /** The budget's row in the RFC's Numbers table, its first cell exactly. */
  readonly rfcRow: string;
} & (
  | { readonly kind: "esm"; readonly entry: string; readonly beside?: string }
  | { readonly kind: "cdn"; readonly script: CdnScript }
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
];

export interface Measurement {
  readonly measure: SizeMeasure;
  /** gzip, in kB of 1,000 bytes. */
  readonly kilobytes: number;
}

/** Every budget measured on the package's builds, made in memory and minified. */
export async function measureSizes(): Promise<Measurement[]> {
  const [esm, plain, cluster] = await Promise.all([
    bundleInMemory(esmBuildOptions()),
    bundleInMemory(cdnBuildOptions("plain")),
    bundleInMemory(cdnBuildOptions("cluster")),
  ]);
  const scripts: Record<CdnScript, Bundle> = { plain, cluster };
  return SIZE_MEASURES.map((measure) => {
    if (measure.kind === "cdn") {
      const script = scripts[measure.script];
      return { measure, kilobytes: gzipKilobytes(script, scriptsOf(script)) };
    }
    return { measure, kilobytes: gzipKilobytes(esm, loadedBy(esm, measure)) };
  });
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

function loadedBy(esm: Bundle, { entry, beside }: EsmMeasure): string[] {
  const loaded = reachableOutputs(esm.metafile, entry);
  if (beside === undefined) return [...loaded];
  const already = reachableOutputs(esm.metafile, beside);
  return [...loaded].filter((path) => !already.has(path));
}
