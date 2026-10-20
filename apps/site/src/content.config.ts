import { defineCollection } from "astro:content";
import { changelogLoader } from "./site/changelog-loader.ts";
import { installLoader } from "./site/install-loader.ts";
import { repoDocsLoader } from "./site/repo-docs-loader.ts";
import { repoFilesLoader } from "./site/repo-files-loader.ts";

export const collections = {
  changelog: defineCollection({ loader: changelogLoader() }),
  docs: defineCollection({ loader: repoDocsLoader() }),
  install: defineCollection({ loader: installLoader() }),
  repoFiles: defineCollection({ loader: repoFilesLoader() }),
};
