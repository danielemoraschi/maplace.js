import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { CDN_SCRIPTS } from "../../../scripts/build/cdn-builds.ts";
import { ROOT } from "../../../scripts/build/package.ts";
import { integrityOf } from "../../../scripts/build/subresource-integrity.ts";
import { tempDir } from "../../../scripts/build/temp-dir.ts";
import { packedPackage } from "../../../scripts/release/fake-registry.ts";
import { PACKAGE_NAME } from "../../../scripts/release/published-package.ts";
import { type BuiltSite, buildAndServeSite, SITE_WAIT_MS } from "./built-site.ts";

const VERSION = "1.2.0";
const PRELOAD = resolve(ROOT, "apps/site/test/published-package-preload.ts");
const preloaded = {
  NODE_OPTIONS: `--import=${pathToFileURL(PRELOAD).href}`,
  PUBLISHED_VERSION: VERSION,
};

/** Bytes the source can't build: what a change to a script since the release comes to. */
const released = (file: string) => `/* released ${file} */`;
const releasedIntegrity = (file: string) => integrityOf(new TextEncoder().encode(released(file)));
const pinOf = (file: string) =>
  `/${PACKAGE_NAME}@${VERSION}/dist/${file}"\n  integrity="${releasedIntegrity(file)}"`;

describe("a site build at a published version", () => {
  const tarballDir = tempDir("published-pin");
  let site: BuiltSite | undefined;
  afterAll(() => site?.close());

  it("a site built after a change to a script keeps the released hash", {
    timeout: SITE_WAIT_MS,
  }, async () => {
    const scripts = Object.values(CDN_SCRIPTS);
    const tarball = join(tarballDir, "maplace.tgz");
    writeFileSync(
      tarball,
      packedPackage(
        VERSION,
        Object.fromEntries(scripts.map((file) => [`dist/${file}`, released(file)])),
      ),
    );
    site = await buildAndServeSite({ ...preloaded, PUBLISHED_TARBALL: tarball });
    const page = (path: string) => readFileSync(join((site as BuiltSite).dir, path), "utf8");

    for (const file of scripts) expect(page("getting-started/index.md")).toContain(pinOf(file));
    expect(page(".well-known/agent-skills/maplace/SKILL.md")).toContain(
      releasedIntegrity(CDN_SCRIPTS.cluster),
    );
    expect(page("index.html")).toContain(releasedIntegrity(CDN_SCRIPTS.plain));
  });

  it("a site build fails, naming npm, while npm can't be reached", {
    timeout: SITE_WAIT_MS,
  }, async () => {
    await expect(buildAndServeSite({ ...preloaded, PUBLISHED_TARBALL: "" })).rejects.toThrow(
      "can't be read from npm",
    );
  });
});
