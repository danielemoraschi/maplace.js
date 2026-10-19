import type { Loader } from "astro/loaders";
import { type Pin, withPinnedScripts } from "../../../../scripts/build/cdn-pins.ts";
import { gitIn } from "../../../../scripts/build/git.ts";
import { packageManifest, ROOT, readRootFile } from "../../../../scripts/build/package.ts";
import { blobBaseFor } from "../../../../scripts/release/repository.ts";
import { cdnPin } from "./cdn-pin.ts";
import { withLinksFromRoot } from "./doc-relative-links.ts";
import { withSiteLinks } from "./site-links.ts";

/** A repo document the site renders as a page of its own. */
export interface RepoDoc {
  /** The page's path segment, and the entry's id. */
  readonly id: string;
  /** Its path in the repo. */
  readonly file: string;
  readonly title: string;
  /** The page's description, for search and sharing. */
  readonly description: string;
  /** Its name in the site's navigation. */
  readonly label: string;
  /** It has the README's pinned CDN scripts, filled in as staging fills them. */
  readonly pinsScripts?: true;
}

/**
 * The repository's page on GitHub: the manifest's `repository`, written out because the header
 * and footer render in a bundled page, where the manifest can't be read (repo-docs.test.ts
 * holds the two together).
 */
export const REPOSITORY_URL = "https://github.com/danielemoraschi/maplace.js";

export const REPO_DOCS: readonly RepoDoc[] = [
  {
    id: "getting-started",
    file: "README.md",
    title: "Getting started",
    description:
      "Install maplace and put a map with a synced list on a page, with one script or a bundler.",
    label: "Getting started",
    pinsScripts: true,
  },
  {
    id: "setup",
    file: "docs/reference/setup.md",
    title: "Setup",
    description: "A Google Maps key, a map ID, and Maps JS on a page, with the element or npm.",
    label: "Setup",
  },
  {
    id: "element",
    file: "docs/reference/element.md",
    title: "The element",
    description:
      "The maplace-map and maplace-location elements: attributes, properties, events, providers and list views.",
    label: "Element",
  },
  {
    id: "locations",
    file: "docs/reference/locations.md",
    title: "Locations",
    description: "Every location field, by type: markers, circles, polylines and polygons.",
    label: "Locations",
  },
  {
    id: "store",
    file: "docs/reference/store.md",
    title: "Store and list view",
    description: "The headless store's options, methods, state and events, and its list view.",
    label: "Store",
  },
  {
    id: "google",
    file: "docs/reference/google.md",
    title: "Google adapter",
    description:
      "The Google Maps adapter: options, your own map, loading Maps JS, map IDs, routes and clustering.",
    label: "Google",
  },
  {
    id: "react",
    file: "docs/reference/react.md",
    title: "React",
    description: "The React binding: provider, map, list, map controls and the store hook.",
    label: "React",
  },
  {
    id: "api",
    file: "docs/reference/api.md",
    title: "API reference",
    description: "Every export of every entry, the error codes and the capabilities.",
    label: "API",
  },
  {
    id: "migrating",
    file: "MIGRATION.md",
    title: "Migrating from 0.2",
    description:
      "Every 0.2 option, location field, method and callback, and what 1.0 does with it.",
    label: "Migrating",
  },
];

/** The site's page for the repo document `id`. */
export function docRoute(id: string): string {
  return `/${id}/`;
}

const ROUTES = Object.fromEntries(REPO_DOCS.map(({ file, id }) => [file, docRoute(id)]));

/** The content loader of the `docs` collection: each repo document, rendered. */
export function repoDocsLoader(): Loader {
  return {
    name: "repo-docs",
    async load({ store, renderMarkdown }) {
      const pin = await cdnPin();
      const blobBase = blobBaseFor(packageManifest(), builtCommit());
      store.clear();
      for (const doc of REPO_DOCS) {
        const rendered = await renderMarkdown(repoDocMarkdown(doc, { pin, blobBase }));
        store.set({
          id: doc.id,
          data: { title: doc.title, description: doc.description },
          rendered,
        });
      }
    },
  };
}

/** The commit the site is built from: its links to the repo's files read them as it saw them. */
function builtCommit(): string {
  return gitIn(ROOT, ["rev-parse", "HEAD"]).trim();
}

export interface RepoDocSettings {
  readonly pin: Pin;
  /** Where the repo's other files are read. */
  readonly blobBase: string;
}

/** `doc`'s Markdown as the site shows it: titled by the page, pinned, its links working. */
export function repoDocMarkdown(doc: RepoDoc, { pin, blobBase }: RepoDocSettings): string {
  const markdown = readRootFile(doc.file);
  const pinned = doc.pinsScripts ? withPinnedScripts(markdown, pin) : markdown;
  const fromRoot = withLinksFromRoot(withoutTitle(pinned), doc.file);
  return withSiteLinks(fromRoot, { routes: ROUTES, blobBase });
}

/** `markdown` without its leading `# title`, which the page writes. */
export function withoutTitle(markdown: string): string {
  return markdown.replace(/^# [^\n]*\n+/, "");
}
