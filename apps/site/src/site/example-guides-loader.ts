import type { Loader } from "astro/loaders";
import { readRootFile } from "../../../../scripts/build/package.ts";
import {
  type ExampleGuideFile,
  exampleGuideFiles,
} from "../../../../scripts/docs/example-guides.ts";
import { siteMarkdownOf } from "./repo-docs-loader.ts";
import { siteBlobBase } from "./site-blob-base.ts";

/** An example's guide, with its text. */
export interface ExampleGuide extends ExampleGuideFile {
  readonly markdown: string;
}

/**
 * The content loader of the `exampleGuides` collection: an entry per example with a guide, by
 * the example's name, rendered with its links working on the site.
 */
export function exampleGuidesLoader(): Loader {
  return {
    name: "example-guides",
    async load({ store, renderMarkdown }) {
      const blobBase = siteBlobBase();
      store.clear();
      for (const { name, file, markdown } of exampleGuides()) {
        const rendered = await renderMarkdown(siteMarkdownOf(markdown, file, blobBase));
        store.set({ id: name, data: {}, rendered });
      }
    },
  };
}

/** Each example's guide, read from the repo (a loader runs unbundled: no glob there). */
export function exampleGuides(): ExampleGuide[] {
  return exampleGuideFiles().map((guide) => ({
    ...guide,
    markdown: readRootFile(guide.file),
  }));
}
