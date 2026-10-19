import { CHANGELOG_FILE } from "../docs/changelog-lines.ts";

/** The repo's documents: what the doc checks read. */
export const DOCS = [
  "README.md",
  "MIGRATION.md",
  CHANGELOG_FILE,
  "docs/rfc-1.0.md",
  "docs/MODERNIZE.md",
  "docs/reference/setup.md",
  "docs/reference/element.md",
  "docs/reference/locations.md",
  "docs/reference/store.md",
  "docs/reference/google.md",
  "docs/reference/react.md",
  "docs/reference/api.md",
] as const;
