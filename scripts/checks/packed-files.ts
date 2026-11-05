import { readFileSync } from "node:fs";
import { createPackageFromTarballData, type Package } from "@arethetypeswrong/core";

/** The package in `tarball`, as attw reads it. */
export function packageIn(tarball: string): Package {
  return createPackageFromTarballData(new Uint8Array(readFileSync(tarball)));
}

/** The files and folders at the top of the package in `tarball`, as npm packed them. */
export function topLevelEntriesIn(tarball: string): Set<string> {
  const pkg = packageIn(tarball);
  const root = `/node_modules/${pkg.packageName}/`;
  return new Set(pkg.listFiles().map((file) => file.slice(root.length).replace(/\/.*/, "")));
}
