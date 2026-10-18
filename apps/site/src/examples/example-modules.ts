import type { ExampleCode } from "./example-sources.ts";

/** A version the site runs from its own bundle, beside the page's element. */
export type LiveVersion = Exclude<ExampleCode["kind"], "html">;

const FILE: Readonly<Record<LiveVersion, string>> = { vanilla: "vanilla.ts", react: "react.tsx" };

// Each version's module as the tests run it, bundled on demand: importing one runs it, into the
// HTML of its host, which the frame holds. Vite reads a glob as written.
const MODULES = import.meta.glob("../../../../packages/maplace/examples/*/{vanilla.ts,react.tsx}");

/** What imports, and so runs, the `version` of the example `name`. */
export function versionModule(name: string, version: LiveVersion): () => Promise<unknown> {
  const file = `examples/${name}/${FILE[version]}`;
  const module = MODULES[`../../../../packages/maplace/${file}`];
  if (module === undefined) throw new Error(`${file} doesn't exist`);
  return module;
}
