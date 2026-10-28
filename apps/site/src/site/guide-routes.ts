import { exampleGuideFile } from "../../../../scripts/docs/example-guides.ts";
import { EXAMPLE_GROUPS, groupPath } from "../examples/example-sections.ts";

/**
 * Each example's section on the site, on its group's page, by its guide's path in the repo: a
 * guide's link to another's goes to the example it explains.
 */
export const GUIDE_ROUTES: Readonly<Record<string, string>> = Object.fromEntries(
  EXAMPLE_GROUPS.flatMap((group) =>
    group.sections.map(({ name }) => [exampleGuideFile(name), `${groupPath(group)}#${name}`]),
  ),
);
