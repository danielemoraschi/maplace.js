import { describe, expect, it } from "vitest";
import config from "../../vitest.config.ts";
import { freshGlobs, holdsGlob } from "./fresh-globs.ts";

describe("freshGlobs", () => {
  it("finds a glob with a type argument too, which Vitest's own check misses", () => {
    expect(holdsGlob('import.meta.glob<string>("./*.html");')).toBe(true);
    expect(holdsGlob('import.meta.glob("./*.html");')).toBe(true);
    expect(holdsGlob('import("./a.html");')).toBe(false);
  });

  it("tells Vitest to leave out a module that globs, and only that", () => {
    let keyOf: ((context: { sourceCode: string }) => unknown) | undefined;
    const configure = freshGlobs().configureVitest as (context: unknown) => void;
    configure({ defineCacheKeyGenerator: (callback: typeof keyOf) => (keyOf = callback) });
    expect(keyOf?.({ sourceCode: 'import.meta.glob<string>("./*.html");' })).toBe(false);
    expect(keyOf?.({ sourceCode: "export const a = 1;" })).toBeUndefined();
  });

  it("is in the repo's test config", () => {
    const names = (config.plugins ?? []).map((plugin) => (plugin as { name: string }).name);
    expect(names).toContain(freshGlobs().name);
  });
});
