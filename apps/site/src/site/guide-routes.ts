import { exampleGuideFile } from "../../../../scripts/docs/example-guides.ts";
import { EXAMPLE_PAGE_ENTRIES } from "../examples/example-sections.ts";

/**
 * Each example's page on the site, by its guide's path in the repo: a guide's link to another's goes
 * to the example it explains.
 */
export const GUIDE_ROUTES: Readonly<Record<string, string>> = Object.fromEntries(
  EXAMPLE_PAGE_ENTRIES.map(({ section, path }) => [exampleGuideFile(section.name), path]),
);
