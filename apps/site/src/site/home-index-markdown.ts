import {
  EXAMPLE_GROUPS,
  type ExampleGroup,
  groupPath,
  sectionHref,
  sectionLabel,
} from "../examples/example-sections.ts";

/** The home page's index of examples (`ExampleIndex.astro`), as Markdown: each feature, then its examples. */
export function homeIndexMarkdown(): string {
  return ["## Examples", ...EXAMPLE_GROUPS.map(groupIndexMarkdown)].join("\n\n");
}

function groupIndexMarkdown(group: ExampleGroup): string {
  const examples = group.sections.map(
    (section) =>
      `- [${sectionLabel(section)} ${section.title}](${sectionHref(group, section)}): ${section.summary}`,
  );
  return [`### [${group.label}](${groupPath(group)})`, group.summary, examples.join("\n")].join(
    "\n\n",
  );
}
