import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { buildCdnScripts, builtCdnScript, CDN_SCRIPTS, type CdnScript } from "./cdn-builds.ts";
import { ROOT } from "./package.ts";
import { tempDir } from "./temp-dir.ts";

const SCRIPTS = Object.keys(CDN_SCRIPTS) as CdnScript[];
const text = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

describe("a CDN script's bytes owe nothing to the machine's paths", () => {
  const dir = tempDir("cdn-reproducible", join(ROOT, ".vitest"));
  let built: readonly Uint8Array[];
  beforeAll(async () => {
    built = await Promise.all(SCRIPTS.map(builtCdnScript));
  }, 120_000);

  it("a script's bytes don't depend on where it is written", { timeout: 120_000 }, async () => {
    await buildCdnScripts(dir);
    const written = SCRIPTS.map((script) => readFileSync(join(dir, CDN_SCRIPTS[script])));
    expect(written.map((bytes) => new Uint8Array(bytes))).toEqual(built);
  });

  it("no script holds the path of the checkout it was built in", () => {
    for (const bytes of built) expect(text(bytes)).not.toContain(ROOT);
  });
});
