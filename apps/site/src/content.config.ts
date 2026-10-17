import { defineCollection } from "astro:content";
import { installLoader } from "./site/cdn-pin.ts";
import { repoDocsLoader } from "./site/repo-docs.ts";

export const collections = {
  docs: defineCollection({ loader: repoDocsLoader() }),
  install: defineCollection({ loader: installLoader() }),
};
