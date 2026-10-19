// `export { a, b as c }` or `export type { … }`, on one line or several, with or without `from`.
const EXPORT_LIST = /^export\s+(?:type\s+)?\{([^}]*)\}/gm;
// `export function f`, `export const c`, `export interface I`, … : one declared name.
const EXPORT_DECLARATION =
  /^export\s+(?:declare\s+)?(?:async\s+)?(?:abstract\s+)?(?:function\*?|const\s+enum|const|let|var|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gm;
// `export *`, `export type *`, `export default`, `export =`, `export import`, a namespace and a
// destructured declaration: exports this reader can't list by name.
const UNLISTABLE_EXPORT =
  /^export\s+(?:(?:type\s+)?\*|default\b|=|import\b|(?:declare\s+)?(?:namespace|module|global)\b|(?:const|let|var)\s+[{[])/m;

interface Exported {
  readonly names: readonly string[];
  /** Where its statement starts in the source. */
  readonly at: number;
}

/** The names a module exports, in source order, read from its TypeScript `source`. */
export function exportedNames(source: string): string[] {
  const unlistable = UNLISTABLE_EXPORT.exec(source);
  if (unlistable !== null) {
    throw new Error(`"${unlistable[0]}": an entry must name each export, so it can be listed`);
  }
  return [...listedExports(source), ...declaredExports(source)]
    .sort((a, b) => a.at - b.at)
    .flatMap(({ names }) => names);
}

function listedExports(source: string): Exported[] {
  return Array.from(source.matchAll(EXPORT_LIST), (match) => ({
    names: namesOfList(match[1] ?? ""),
    at: match.index,
  }));
}

function declaredExports(source: string): Exported[] {
  return Array.from(source.matchAll(EXPORT_DECLARATION), (match) => ({
    names: [match[1] ?? ""],
    at: match.index,
  }));
}

/** The names an export list gives: `a, type B, c as d` → `a`, `B`, `d`. */
function namesOfList(list: string): string[] {
  return list
    .split(",")
    .map((item) => item.trim().replace(/^type\s+/, ""))
    .filter((item) => item !== "")
    .map((item) => item.split(/\s+as\s+/).at(-1) ?? item);
}
