import type { Loader } from "astro/loaders";
import { siteBlobBase } from "./site-blob-base.ts";

/** The `repoFiles` collection's one entry: where the repo's files are read on GitHub. */
export const REPO_FILES_ENTRY = "blob-base";

/**
 * The content loader of the `repoFiles` collection: `siteBlobBase()`, for the pages that link a
 * repo file (a bundled page can't ask git).
 */
export function repoFilesLoader(): Loader {
  return {
    name: "repo-files",
    async load({ store }) {
      store.clear();
      store.set({ id: REPO_FILES_ENTRY, data: { blobBase: siteBlobBase() } });
    },
  };
}
