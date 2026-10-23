import { build } from "esbuild";
import { type Browser, chromium } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { builtCdnScript, CDN_SCRIPTS, type CdnScript } from "./cdn-builds.ts";
import { openCdnScriptPage } from "./cdn-script-page.ts";
import { esmBuildOptions } from "./esm-build.ts";
import { PACKAGE_ENTRIES } from "./package.ts";

type Entry = keyof typeof PACKAGE_ENTRIES;

/**
 * The npm entries each CDN script stands for, whose exports its `Maplace` holds (W33), and what it
 * adds of the packages it bundles. The cluster script is the plain one's entry built with the
 * clusterer, so the plain one speaks for both.
 */
const GLOBALS: Readonly<Record<"plain" | "maplibre", { entries: Entry[]; bundled: string[] }>> = {
  plain: { entries: ["core", "element", "google"], bundled: [] },
  maplibre: { entries: ["core", "element", "maplibre"], bundled: ["maplibre"] },
};

const SCRIPTS = Object.keys(GLOBALS) as (keyof typeof GLOBALS)[];

let browser: Browser | undefined;
let exportsOf: (entry: Entry) => readonly string[];
let scripts: ReadonlyMap<CdnScript, Uint8Array>;

/** Each entry's run-time exports, as esbuild's ESM build says (types gone), and the scripts. */
beforeAll(async () => {
  const entries = [...new Set(Object.values(GLOBALS).flatMap(({ entries }) => entries))];
  const [esm, built, launched] = await Promise.all([
    build({
      ...esmBuildOptions("dist-in-memory"),
      entryPoints: entries.map((entry) => PACKAGE_ENTRIES[entry]),
      write: false,
      metafile: true,
      logLevel: "silent",
    }),
    Promise.all(SCRIPTS.map(builtCdnScript)),
    chromium.launch(),
  ]);
  const outputs = Object.values(esm.metafile.outputs);
  exportsOf = (entry) =>
    outputs.find(({ entryPoint }) => entryPoint === PACKAGE_ENTRIES[entry])?.exports ?? [];
  scripts = new Map(SCRIPTS.map((script, index) => [script, built[index] as Uint8Array]));
  browser = launched;
}, 120_000);

afterAll(async () => {
  await browser?.close();
});

/** The names a page reads on `Maplace` once `script` has run on it. */
async function maplaceNames(script: CdnScript): Promise<string[]> {
  const opened = await openCdnScriptPage(browser as Browser, {
    file: CDN_SCRIPTS[script],
    script: scripts.get(script) as Uint8Array,
    body: "",
  });
  try {
    return await opened.page.evaluate(() =>
      Object.keys((globalThis as unknown as { Maplace: object }).Maplace).sort(),
    );
  } finally {
    await opened.close();
  }
}

describe("each CDN script", () => {
  it.each(SCRIPTS)(
    "sets Maplace to what its npm entries export (%s)",
    async (script) => {
      const { entries, bundled } = GLOBALS[script];
      const expected = [...entries.flatMap((entry) => exportsOf(entry)), ...bundled];
      expect(expected.length).toBeGreaterThan(5);
      expect(await maplaceNames(script)).toEqual([...new Set(expected)].sort());
    },
    60_000,
  );
});
