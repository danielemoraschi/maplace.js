import { execFileSync } from "node:child_process";
import { existsSync, globSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { withJsSpecifiers } from "./declaration-specifiers.ts";
import { DIST, PACKAGE_DIR, ROOT, TSC } from "./package.ts";

const BUILD_CONFIG = resolve(ROOT, PACKAGE_DIR, "tsconfig.build.json");

/** Emits the entries' `.d.ts` into `outdir`, each specifier a path `node16` consumers resolve. */
export function emitDeclarations(outdir: string = DIST): void {
  const out = resolve(ROOT, outdir);
  execFileSync(TSC, ["-p", BUILD_CONFIG, "--outDir", out], { stdio: "inherit" });
  for (const file of declarationFiles(out)) {
    const hasDeclaration = (path: string) => existsSync(join(dirname(file), path));
    writeFileSync(file, withJsSpecifiers(readFileSync(file, "utf8"), hasDeclaration));
  }
}

/** Every `.d.ts` under `dir`, by absolute path. */
export function declarationFiles(dir: string): string[] {
  return globSync("**/*.d.ts", { cwd: dir }).map((file) => join(dir, file));
}
