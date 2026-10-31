import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { packTarball } from "../build/pack-tarball.ts";
import type { Fetch } from "./published-package.ts";

/**
 * A package of `files` (path to text) as `npm pack` really packs it, as bytes. Its temp dir isn't
 * `temp-dir.ts`'s: that imports vitest, and a site build's preload loads this file outside it.
 */
export function packedPackage(
  version: string,
  files: Readonly<Record<string, string>>,
): Uint8Array {
  const dir = mkdtempSync(join(tmpdir(), "maplace-packed-"));
  try {
    const stage = join(dir, "stage");
    const manifest = JSON.stringify({ name: "maplace", version });
    for (const [path, text] of Object.entries({ "package.json": manifest, ...files })) {
      mkdirSync(dirname(join(stage, path)), { recursive: true });
      writeFileSync(join(stage, path), text);
    }
    return readFileSync(packTarball(stage, dir));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const PACKAGE_URL = "https://registry.npmjs.org/maplace/";

/**
 * A test's npm, holding `tarball` as `version` and no other version. Throws on any other URL, so
 * a test can't reach the network by accident.
 */
export function registryHolding(version: string, tarball: Uint8Array): Fetch {
  const tarballUrl = `${PACKAGE_URL}-/maplace-${version}.tgz`;
  const integrity = `sha512-${createHash("sha512").update(tarball).digest("base64")}`;
  return async (url) => {
    if (url === tarballUrl) return new Response(new Uint8Array(tarball));
    if (url === `${PACKAGE_URL}${version}`) {
      return Response.json({ dist: { tarball: tarballUrl, integrity } });
    }
    if (url.startsWith(PACKAGE_URL)) return new Response("not found", { status: 404 });
    throw new Error(`a test asked the network for ${url}`);
  };
}
