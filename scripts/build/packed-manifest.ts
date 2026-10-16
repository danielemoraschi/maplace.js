/** An `exports` target: a path, or conditions naming paths. */
type ExportTarget = string | { readonly [condition: string]: string };

export interface Manifest {
  readonly exports: { readonly [path: string]: ExportTarget };
  readonly [field: string]: unknown;
}

/** Points the repo's own tools at `src`; nothing outside the repo has it. */
const SOURCE_CONDITION = "maplace:source";

/**
 * The manifest npm packs: without the source condition, and without the exports only it
 * served (`./react`, source-only until 1.x).
 */
export function packedManifest(manifest: Manifest): Manifest {
  const exports = Object.entries(manifest.exports).flatMap(([path, target]) => {
    const packed = withoutSource(target);
    return packed === undefined ? [] : [[path, packed] as const];
  });
  return { ...manifest, exports: Object.fromEntries(exports) };
}

function withoutSource(target: ExportTarget): ExportTarget | undefined {
  if (typeof target === "string") return target;
  const conditions = Object.entries(target).filter(([condition]) => condition !== SOURCE_CONDITION);
  return conditions.length === 0 ? undefined : Object.fromEntries(conditions);
}
