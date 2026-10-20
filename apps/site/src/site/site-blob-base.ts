import { headCommit } from "../../../../scripts/build/git.ts";
import { packageManifest, ROOT } from "../../../../scripts/build/package.ts";
import { blobBaseFor } from "../../../../scripts/release/repository.ts";

/** Where every link the site makes to a repo file goes: GitHub, at the commit it is built from. */
export function siteBlobBase(): string {
  return blobBaseFor(packageManifest(), headCommit(ROOT));
}
