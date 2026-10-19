import { defineCollection } from "astro:content";
import { installLoader } from "./site/cdn-pin.ts";
import { changelogLoader } from "./site/changelog-loader.ts";
import { repoDocsLoader } from "./site/repo-docs.ts";

export const collections = {
  changelog: defineCollection({ loader: changelogLoader() }),
  docs: defineCollection({ loader: repoDocsLoader() }),
  install: defineCollection({ loader: installLoader() }),
};
