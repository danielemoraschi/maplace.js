import type { Loader } from "astro/loaders";
import { gitIn } from "../../../../scripts/build/git.ts";
import { packageManifest, ROOT, readRootFile } from "../../../../scripts/build/package.ts";
import { CHANGELOG_FILE } from "../../../../scripts/checks/changelog-lines.ts";
import { blobBaseFor, repositoryPageFor } from "../../../../scripts/release/repository.ts";
import { type ChangelogLinks, changelogMarkdown } from "./changelog-markdown.ts";
import { docRoute, REPO_DOCS } from "./repo-docs.ts";

/** The `changelog` collection's one entry: CHANGELOG.md, rendered. */
export const CHANGELOG_ENTRY = "changelog";

/** The content loader of the `changelog` collection (W10b). */
export function changelogLoader(): Loader {
  return {
    name: "changelog",
    async load({ store, renderMarkdown }) {
      const manifest = packageManifest();
      const blobBase = blobBaseFor(manifest, builtCommit());
      const links = changelogLinks(blobBase, repositoryPageFor(manifest));
      const markdown = changelogMarkdown(readRootFile(CHANGELOG_FILE), links);
      const rendered = await renderMarkdown(markdown);
      store.clear();
      store.set({
        id: CHANGELOG_ENTRY,
        data: { source: `${blobBase}${CHANGELOG_FILE}` },
        rendered,
      });
    },
  };
}

function changelogLinks(blobBase: string, repositoryPage: string): ChangelogLinks {
  return {
    routes: Object.fromEntries(REPO_DOCS.map(({ file, id }) => [file, docRoute(id)])),
    blobBase,
    issueBase: `${repositoryPage}/issues/`,
  };
}

/** The commit the site is built from: its links to the repo's files read them as it saw them. */
function builtCommit(): string {
  return gitIn(ROOT, ["rev-parse", "HEAD"]).trim();
}
