import type { Plugin } from "vitest/config";

/**
 * Whether a module's source globs for files. Its result depends on more than its own content, so
 * a cached one would keep the files it found then. Vitest leaves out a module holding the exact
 * text `import.meta.glob(`, which `import.meta.glob<string>(` isn't, so a new example went unseen.
 */
export function holdsGlob(sourceCode: string): boolean {
  return sourceCode.includes("import.meta.glob");
}

/** Leaves every module that globs out of Vitest's module cache. */
export function freshGlobs(): Plugin {
  return {
    name: "maplace:fresh-globs",
    configureVitest({ defineCacheKeyGenerator }) {
      defineCacheKeyGenerator(({ sourceCode }) => (holdsGlob(sourceCode) ? false : undefined));
    },
  };
}
