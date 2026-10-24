import type { Provider } from "../examples/example-providers.ts";
import { INERT_SCRIPT_TYPE } from "../examples/page-scripts.ts";
import { providerOf } from "./by-provider.ts";

/**
 * What starts a script version (W33), its provider readied: its provider's `Maplace` put on the
 * page (`installMaplace`), as its CDN script would set it, then its program, a module script
 * (`liveScript`), run once, from its text, by `runModule`: a throw as its top level runs
 * rejects, failing the version's start as a module version's does. A failed install runs
 * nothing, and fails the version's start.
 */
export function scriptVersionStart(
  installMaplace: (provider: Provider) => Promise<void>,
  runModule: (program: string) => Promise<unknown>,
): (version: HTMLElement) => Promise<void> {
  return async (version) => {
    await installMaplace(providerOf(version));
    const programs = version.querySelectorAll(`script[type="${INERT_SCRIPT_TYPE}"]`);
    for (const program of programs) {
      program.remove();
      await runModule(program.textContent ?? "");
    }
  };
}

/** `program` run as written, as an imported module: a throw as it runs rejects the import. */
export function importAsModule(program: string): Promise<unknown> {
  return import(
    /* @vite-ignore */ `data:text/javascript;charset=utf-8,${encodeURIComponent(program)}`
  );
}
