import { defineCollection } from "astro:content";
import { agentSkillLoader } from "./site/agent-skill-loader.ts";
import { changelogLoader } from "./site/changelog-loader.ts";
import { exampleGuidesLoader } from "./site/example-guides-loader.ts";
import { installLoader } from "./site/install-loader.ts";
import { repoDocsLoader } from "./site/repo-docs-loader.ts";
import { repoFilesLoader } from "./site/repo-files-loader.ts";
import { searchFactsLoader } from "./site/search-facts-loader.ts";

export const collections = {
  agentSkill: defineCollection({ loader: agentSkillLoader() }),
  changelog: defineCollection({ loader: changelogLoader() }),
  docs: defineCollection({ loader: repoDocsLoader() }),
  exampleGuides: defineCollection({ loader: exampleGuidesLoader() }),
  install: defineCollection({ loader: installLoader() }),
  repoFiles: defineCollection({ loader: repoFilesLoader() }),
  searchFacts: defineCollection({ loader: searchFactsLoader() }),
};
