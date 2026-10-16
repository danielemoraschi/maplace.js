/** A relative module specifier in a declaration file, after `from`, `import` or `import(`. */
const RELATIVE_SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(["'])(\.{1,2}\/[^"']*)\2/g;

/**
 * `source`, a declaration file, with each relative specifier the `.js` path a `node16` consumer
 * resolves: `./x` → `./x.js`, `./dir` → `./dir/index.js`. TypeScript copies specifiers as the
 * source wrote them, without extensions. `hasDeclaration` says whether a path, relative to the
 * file, is an emitted `.d.ts`.
 */
export function withJsSpecifiers(
  source: string,
  hasDeclaration: (path: string) => boolean,
): string {
  return source.replaceAll(
    RELATIVE_SPECIFIER,
    (_, before: string, quote: string, specifier: string) =>
      `${before}${quote}${jsPathOf(specifier, hasDeclaration)}${quote}`,
  );
}

function jsPathOf(specifier: string, hasDeclaration: (path: string) => boolean): string {
  if (specifier.endsWith(".js")) return specifier;
  if (hasDeclaration(`${specifier}.d.ts`)) return `${specifier}.js`;
  if (hasDeclaration(`${specifier}/index.d.ts`)) return `${specifier}/index.js`;
  throw new Error(`no declaration for ${specifier}`);
}
