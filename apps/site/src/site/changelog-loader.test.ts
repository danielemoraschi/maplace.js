import type { LoaderContext } from "astro/loaders";
import { beforeAll, describe, expect, it } from "vitest";
import { headCommit } from "../../../../scripts/build/git.ts";
import { packageManifest, ROOT } from "../../../../scripts/build/package.ts";
import { blobBaseFor, repositoryPageFor } from "../../../../scripts/release/repository.ts";
import { CHANGELOG_ENTRY, changelogLoader } from "./changelog-loader.ts";

interface StoredEntry {
  readonly id: string;
  readonly data: { readonly source: string };
  readonly rendered: { readonly html: string };
}

type StoreCall = "clear" | StoredEntry;

/** What the loader does to its store: the store's calls, in order. */
async function load(): Promise<StoreCall[]> {
  const calls: StoreCall[] = [];
  const context = {
    store: { clear: () => calls.push("clear"), set: (entry: StoredEntry) => calls.push(entry) },
    renderMarkdown: async (markdown: string) => ({ html: markdown }),
  };
  await changelogLoader().load(context as unknown as LoaderContext);
  return calls;
}

describe("changelogLoader", () => {
  let calls: StoreCall[];
  let entry: StoredEntry;

  beforeAll(async () => {
    calls = await load();
    entry = calls[1] as StoredEntry;
  });

  it("stores the changelog as one rendered entry", () => {
    expect(calls).toHaveLength(2);
    expect(calls[0]).toBe("clear");
    expect(entry.id).toBe(CHANGELOG_ENTRY);
    expect(entry.rendered.html.startsWith("## ")).toBe(true);
  });

  it("links the source and the issues to the repository the manifest names", () => {
    const commit = headCommit(ROOT);
    expect(entry.data.source).toBe(`${blobBaseFor(packageManifest(), commit)}CHANGELOG.md`);
    expect(entry.rendered.html).toContain(`${repositoryPageFor(packageManifest())}/issues/147`);
  });

  it("sends README and MIGRATION links to their site pages", () => {
    expect(entry.rendered.html).toContain("](/migrating/)");
    expect(entry.rendered.html).toContain("](/getting-started/)");
    expect(entry.rendered.html).not.toContain("](MIGRATION.md");
  });
});
