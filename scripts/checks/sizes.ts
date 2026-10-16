import { type Bundle, bundle, gzipKilobytes, reachableOutputs } from "./bundle-size.ts";
import { missingFrom, RFC } from "./rfc.ts";
import { rfcBudgets } from "./rfc-numbers.ts";

const SRC = "packages/maplace/src";
const CORE = `${SRC}/index.ts`;
const GOOGLE = `${SRC}/google/index.ts`;
const ELEMENT_GOOGLE = `${SRC}/element/google.ts`;

/**
 * How one budget of RFC §3 Numbers is measured: what a page loads for `entry`, in one of the
 * bundles, with or without what it imports on demand, and less what it shares with `beside`.
 */
export interface SizeMeasure {
  readonly name: string;
  /** The budget's row in the RFC's Numbers table, its first cell exactly. */
  readonly rfcRow: string;
  readonly bundle: keyof Bundles;
  readonly entry: string;
  readonly dynamic: boolean;
  readonly beside?: string;
}

/**
 * The bundles every budget is measured on, built as the package will be: the core and Google
 * entries sharing chunks (one copy of the core), and the CDN shape, its clusterer a lazy chunk.
 */
interface Bundles {
  readonly adapter: Bundle;
  readonly element: Bundle;
}

export const SIZE_MEASURES: readonly SizeMeasure[] = [
  { name: "maplace", rfcRow: "Core (`maplace`)", bundle: "adapter", entry: CORE, dynamic: false },
  {
    name: "maplace/google",
    rfcRow: "Google adapter (`maplace/google`)",
    bundle: "adapter",
    entry: GOOGLE,
    dynamic: false,
    beside: CORE,
  },
  {
    name: "element CDN",
    rfcRow: "Element CDN build (core + Google + list view + element)",
    bundle: "element",
    entry: ELEMENT_GOOGLE,
    dynamic: false,
  },
  {
    name: "element CDN with clustering",
    rfcRow: "Element CDN build with clustering",
    bundle: "element",
    entry: ELEMENT_GOOGLE,
    dynamic: true,
  },
];

export interface Measurement {
  readonly measure: SizeMeasure;
  /** gzip, in kB of 1,000 bytes. */
  readonly kilobytes: number;
}

/** Every budget measured, on bundles built for `target` (ES2020 unless given). */
export function measureSizes(target?: string): Measurement[] {
  const bundles: Bundles = {
    adapter: bundle({ entries: [CORE, GOOGLE], splitting: true, target }),
    element: bundle({ entries: [ELEMENT_GOOGLE], splitting: true, target }),
  };
  return SIZE_MEASURES.map((measure) => {
    const bundled = bundles[measure.bundle];
    return { measure, kilobytes: gzipKilobytes(bundled, loadedBy(bundled, measure)) };
  });
}

/** Each entry over its RFC budget, and each budget measured or written in one place only. */
export function check(
  measurements: readonly Measurement[] = measureSizes(),
  budgets: ReadonlyMap<string, number> = rfcBudgets(),
): string[] {
  const measured = measurements.map(({ measure }) => measure.rfcRow);
  return [
    ...missingFrom([...budgets.keys()], measured).map((row) => `${row} has no budget in ${RFC}`),
    ...missingFrom(measured, [...budgets.keys()]).map(
      (row) => `${row} in ${RFC} is never measured`,
    ),
    ...measurements.flatMap(({ measure, kilobytes }) => {
      const budget = budgets.get(measure.rfcRow);
      if (budget === undefined || kilobytes <= budget) return [];
      return [`${measure.name} is ${kilobytes.toFixed(2)} kB gzip, over its ${budget} kB budget`];
    }),
  ];
}

function loadedBy(bundled: Bundle, { entry, dynamic, beside }: SizeMeasure): Set<string> {
  const loaded = reachableOutputs(bundled.metafile, entry, { dynamic });
  if (beside === undefined) return loaded;
  const already = reachableOutputs(bundled.metafile, beside, { dynamic: false });
  return new Set([...loaded].filter((path) => !already.has(path)));
}
