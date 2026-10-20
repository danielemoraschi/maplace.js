import type { LoaderContext } from "astro/loaders";
import { describe, expect, it } from "vitest";
import { headCommit } from "../../../../scripts/build/git.ts";
import { ROOT } from "../../../../scripts/build/package.ts";
import { REPOSITORY_URL } from "./repo-docs.ts";
import { REPO_FILES_ENTRY, repoFilesLoader } from "./repo-files-loader.ts";

describe("repoFilesLoader", () => {
  it("keeps the repo's blob URL on GitHub at the commit the site is built from", async () => {
    const calls: unknown[] = [];
    const store = { clear: () => calls.push("clear"), set: (entry: unknown) => calls.push(entry) };
    await repoFilesLoader().load({ store } as unknown as LoaderContext);
    expect(calls).toEqual([
      "clear",
      {
        id: REPO_FILES_ENTRY,
        data: {
          blobBase: `${REPOSITORY_URL}/blob/${headCommit(ROOT)}/`,
        },
      },
    ]);
  });
});
