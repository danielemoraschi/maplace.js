import {
  EXAMPLE_GROUPS,
  type ExampleGroup,
  examplePagesOf,
  groupPath,
} from "../examples/example-sections.ts";

/** The home page's index of examples (`ExampleIndex.astro`), as Markdown: each category, then its examples. */
export function homeIndexMarkdown(): string {
  return ["## Examples", ...EXAMPLE_GROUPS.map(groupIndexMarkdown)].join("\n\n");
}

/** `group`'s examples in `ExampleList.astro`'s words: number and title linking the page, summary. */
export function exampleListMarkdown(group: ExampleGroup): string {
  return examplePagesOf(group)
    .map(
      ({ section, path, number }) => `- [${number} ${section.title}](${path}): ${section.summary}`,
    )
    .join("\n");
}

function groupIndexMarkdown(group: ExampleGroup): string {
  return [
    `### [${group.label}](${groupPath(group)})`,
    group.summary,
    exampleListMarkdown(group),
  ].join("\n\n");
}
