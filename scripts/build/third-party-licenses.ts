import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Metafile } from "esbuild";
import { ROOT } from "./package.ts";

/** A package's directory in an input path: the last `node_modules/<name>` or `node_modules/@scope/<name>`. */
const PACKAGE_IN_PATH = /^(?:.*\/)?node_modules\/(?:@[^/]+\/)?[^/]+/;

const LICENCE_FILE = /^licen[cs]e/i;

interface PackageManifest {
  readonly name: string;
  readonly version: string;
  readonly license?: unknown;
}

/** The directories of the packages bundles took code from, each once, sorted. */
export function bundledPackages(metafiles: readonly Metafile[]): string[] {
  const dirs = metafiles
    .flatMap((metafile) => Object.keys(metafile.inputs))
    .flatMap((input) => PACKAGE_IN_PATH.exec(input)?.[0] ?? []);
  return [...new Set(dirs)].sort((a, b) => a.localeCompare(b));
}

/** The notices bundles owe the packages they took code from: each one's licence text. */
export function thirdPartyLicenses(metafiles: readonly Metafile[]): string {
  const notices = bundledPackages(metafiles).map((dir) => noticeOf(resolve(ROOT, dir)));
  return [
    "maplace's CDN scripts bundle these packages, each under its own licence.",
    ...notices,
  ].join("\n\n");
}

function noticeOf(dir: string): string {
  const { name, version, license } = JSON.parse(
    readFileSync(join(dir, "package.json"), "utf8"),
  ) as PackageManifest;
  const file = readdirSync(dir).find((entry) => LICENCE_FILE.test(entry));
  if (file === undefined) throw new Error(`${name} has no licence file to bundle`);
  const licence = typeof license === "string" ? license : "see below";
  return `--- ${name} ${version} (${licence}) ---\n\n${readFileSync(join(dir, file), "utf8").trim()}`;
}
