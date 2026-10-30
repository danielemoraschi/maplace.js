import type { Loader } from "astro/loaders";
import { packageManifest, readRootFile } from "../../../../scripts/build/package.ts";
import { CHANGELOG_FILE } from "../../../../scripts/docs/changelog-lines.ts";
import { repositoryPageFor } from "../../../../scripts/release/repository.ts";
import { type ChangelogLinks, changelogMarkdown } from "./changelog-markdown.ts";
import { DOC_ROUTES } from "./repo-docs.ts";
import { siteBlobBase } from "./site-blob-base.ts";

/** The `changelog` collection's one entry: CHANGELOG.md, rendered. */
export const CHANGELOG_ENTRY = "changelog";

/** The content loader of the `changelog` collection (W10b). */
export function changelogLoader(): Loader {
  return {
    name: "changelog",
    async load({ store, renderMarkdown }) {
      const blobBase = siteBlobBase();
      const links = changelogLinks(blobBase, repositoryPageFor(packageManifest()));
      const markdown = changelogMarkdown(readRootFile(CHANGELOG_FILE), links);
      const rendered = await renderMarkdown(markdown);
      store.clear();
      store.set({
        id: CHANGELOG_ENTRY,
        data: { source: `${blobBase}${CHANGELOG_FILE}` },
        body: markdown,
        rendered,
      });
    },
  };
}

function changelogLinks(blobBase: string, repositoryPage: string): ChangelogLinks {
  return {
    routes: DOC_ROUTES,
    blobBase,
    issueBase: `${repositoryPage}/issues/`,
  };
}
