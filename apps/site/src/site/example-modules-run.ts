import type { Plugin } from "vite";

/** A version module of an example, which the site imports to run. */
const VERSION_MODULE = /\/packages\/maplace\/examples\/[^/]+\/(vanilla\.ts|react\.tsx)$/;

/**
 * Marks the examples' version modules as running when imported. They export nothing, and the
 * package's `sideEffects` lists only its element entries, so a bundler would otherwise drop
 * their statements and a chosen version would run nothing.
 */
export function exampleModulesRun(): Plugin {
  return {
    name: "maplace-example-modules-run",
    transform(code, id) {
      return VERSION_MODULE.test(id) ? { code, moduleSideEffects: true } : undefined;
    },
  };
}
