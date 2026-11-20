import type { Loader } from "astro/loaders";
import { tablesIn } from "../../../../scripts/docs/markdown.ts";
import {
  EXAMPLE_GROUPS,
  type ExampleGroup,
  type ReferenceCut,
} from "../examples/example-sections.ts";
import { cdnPin } from "./cdn-pin.ts";
import { docRoute, repoDoc } from "./repo-docs.ts";
import { docSectionOnSite, type RepoDocSettings } from "./repo-docs-loader.ts";
import { siteBlobBase } from "./site-blob-base.ts";
import { headingSlug } from "./site-link-targets.ts";

/**
 * The content loader of the `groupReferences` collection: an entry per feature, by its group's
 * id, holding the reference tables its page shows, cut from the docs (D31), rendered.
 */
export function groupReferencesLoader(): Loader {
  return {
    name: "group-references",
    async load({ store, renderMarkdown }) {
      const settings = { pin: await cdnPin(), blobBase: siteBlobBase() };
      store.clear();
      for (const group of EXAMPLE_GROUPS) {
        const body = groupReferenceMarkdown(group, settings);
        const rendered = await renderMarkdown(body);
        store.set({ id: group.id, data: {}, body, rendered });
      }
    },
  };
}

/**
 * The reference tables `group`'s page shows, each under a heading that links the section it's cut
 * from, their links working on the site, as the docs' own pages have them.
 */
export function groupReferenceMarkdown(group: ExampleGroup, settings: RepoDocSettings): string {
  return group.references.map((cut) => referenceTable(cut, settings)).join("\n\n");
}

/**
 * The tables under `cut`'s heading, its links to the doc's own headings going to the doc's page.
 * Throws naming the doc when the heading isn't there, or holds no table: a page never shows an
 * empty reference.
 */
function referenceTable({ doc: id, heading }: ReferenceCut, settings: RepoDocSettings): string {
  const doc = repoDoc(id);
  const tables = tablesIn(docSectionOnSite(id, heading, settings));
  if (tables.length === 0) throw new Error(`${doc.file}: "${heading}" holds no table`);
  const text = tables.map((table) => table.join("\n")).join("\n\n");
  const title = heading.replace(/^#+ /, "");
  const link = `${docRoute(id)}#${headingSlug(heading)}`;
  return [`### ${title}, from the [${doc.label} reference](${link})`, text].join("\n\n");
}
