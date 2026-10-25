import type { Provider } from "../examples/example-providers.ts";
import { INERT_SCRIPT_TYPE } from "../examples/page-scripts.ts";
import { providerOf } from "./by-provider.ts";
import { failingWith } from "./version-start.ts";

/**
 * What starts a script version (W33), its provider readied: its provider's `Maplace` put on the
 * page (`installMaplace`), as its CDN script would set it, then its program, a module script
 * (`liveScript`), run once, from its text, by `runModule`: a throw as its top level runs
 * rejects, failing the version's start as its program's. A failed install runs nothing, and
 * fails the version's start as the site's script that didn't load.
 */
export function scriptVersionStart(
  installMaplace: (provider: Provider) => Promise<void>,
  runModule: (program: string) => Promise<unknown>,
): (version: HTMLElement) => Promise<void> {
  const install = failingWith("script", installMaplace);
  const run = failingWith("program", runModule);
  return async (version) => {
    await install(providerOf(version));
    const programs = version.querySelectorAll(`script[type="${INERT_SCRIPT_TYPE}"]`);
    for (const program of programs) {
      program.remove();
      await run(program.textContent ?? "");
    }
  };
}

/** `program` run as written, as an imported module: a throw as it runs rejects the import. */
export function importAsModule(program: string): Promise<unknown> {
  return import(
    /* @vite-ignore */ `data:text/javascript;charset=utf-8,${encodeURIComponent(program)}`
  );
}
