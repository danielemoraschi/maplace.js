/** An `exports` target: a path, or conditions naming paths. */
type ExportTarget = string | { readonly [condition: string]: string };

export interface Manifest {
  readonly exports: { readonly [path: string]: ExportTarget };
  readonly [field: string]: unknown;
}

/** Points the repo's own tools at `src`; nothing outside the repo has it. */
const SOURCE_CONDITION = "maplace:source";

/** Where the source is: npm packs none of it. */
const SOURCE_DIR = "./src/";

/**
 * The manifest npm packs: without the source condition, any export only it served, and the
 * source's side effects.
 */
export function packedManifest(manifest: Manifest): Manifest {
  const exports = Object.entries(manifest.exports).flatMap(([path, target]) => {
    const packed = withoutSource(target);
    return packed === undefined ? [] : [[path, packed] as const];
  });
  const packed = { ...manifest, exports: Object.fromEntries(exports) };
  const { sideEffects } = manifest;
  if (!Array.isArray(sideEffects)) return packed;
  return { ...packed, sideEffects: sideEffects.filter((path) => !path.startsWith(SOURCE_DIR)) };
}

function withoutSource(target: ExportTarget): ExportTarget | undefined {
  if (typeof target === "string") return target;
  const conditions = Object.entries(target).filter(([condition]) => condition !== SOURCE_CONDITION);
  return conditions.length === 0 ? undefined : Object.fromEntries(conditions);
}
