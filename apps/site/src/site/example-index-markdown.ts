import {
  EXAMPLE_GROUPS,
  type ExampleGroup,
  examplePagesOf,
  groupPath,
} from "../examples/example-sections.ts";
import { EXAMPLES_INTRO } from "../examples/examples-page.ts";

/** A category heading's level: 3 under the home index's `## Examples`, 2 right under a page's title. */
export type CategoryHeadingDepth = 2 | 3;

/** The home page's index of examples (`ExampleIndex.astro`), as Markdown: each category, then its examples. */
export function homeIndexMarkdown(): string {
  return ["## Examples", EXAMPLES_INTRO, exampleCategoriesMarkdown(3)].join("\n\n");
}

/** The examples page's index (`pages/examples/index.astro`), as Markdown: each category right under its title. */
export function examplesPageIndexMarkdown(): string {
  return exampleCategoriesMarkdown(2);
}

/** Every category (`ExampleCategories.astro`), as Markdown: its heading at `headingDepth`, then its examples. */
function exampleCategoriesMarkdown(headingDepth: CategoryHeadingDepth): string {
  return EXAMPLE_GROUPS.map((group) => groupIndexMarkdown(group, headingDepth)).join("\n\n");
}

/** `group`'s examples in `ExampleList.astro`'s words: title linking the page, summary. */
export function exampleListMarkdown(group: ExampleGroup): string {
  return examplePagesOf(group)
    .map(({ section, path }) => `- [${section.title}](${path}): ${section.summary}`)
    .join("\n");
}

function groupIndexMarkdown(group: ExampleGroup, headingDepth: CategoryHeadingDepth): string {
  return [
    `${"#".repeat(headingDepth)} [${group.label}](${groupPath(group)})`,
    group.summary,
    exampleListMarkdown(group),
  ].join("\n\n");
}
