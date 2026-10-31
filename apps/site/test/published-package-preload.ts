import fs, { readFileSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { registryHolding } from "../../../scripts/release/fake-registry.ts";

/**
 * Test-only, by `--import`: a site build's process seeing the package's manifest at
 * `PUBLISHED_VERSION`, and an npm holding `PUBLISHED_TARBALL`, or down when that is empty. So the
 * build never touches the network, and no production code has a way to fake a version.
 */
const version = process.env.PUBLISHED_VERSION ?? "";
const tarballPath = process.env.PUBLISHED_TARBALL ?? "";

const MANIFEST = /packages[/\\]maplace[/\\]package\.json$/;
const originalRead = readFileSync;

fs.readFileSync = ((path: fs.PathOrFileDescriptor, options?: never) => {
  const content = originalRead(path, options);
  if (typeof path !== "string" || !MANIFEST.test(path)) return content;
  return JSON.stringify({ ...JSON.parse(String(content)), version });
}) as typeof fs.readFileSync;
syncBuiltinESMExports();

globalThis.fetch = (
  tarballPath === ""
    ? () => Promise.reject(new Error("npm is down"))
    : registryHolding(version, originalRead(tarballPath))
) as typeof fetch;
