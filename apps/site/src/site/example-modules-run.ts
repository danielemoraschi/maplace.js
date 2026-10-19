import type { Plugin } from "vite";
import { VERSION_MODULES } from "../examples/example-versions.ts";

const MODULE_FILES = Object.values(VERSION_MODULES).map((file) =>
  file.replaceAll(".", String.raw`\.`),
);

/** A version module of an example, which the site imports to run. */
const VERSION_MODULE = new RegExp(`/packages/maplace/examples/[^/]+/(${MODULE_FILES.join("|")})$`);

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
