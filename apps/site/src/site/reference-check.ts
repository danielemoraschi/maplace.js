import { readRootFile } from "../../../../scripts/build/package.ts";
import { backticked, section, tableRows } from "../../../../scripts/checks/markdown.ts";
import { missingFrom } from "../../../../scripts/checks/rfc.ts";

/** A table of a reference page and the names it must list. */
export interface ReferenceTable {
  /** The page, from the repo root. */
  readonly doc: string;
  /** The heading line the table sits under, exactly: "## Markers". */
  readonly heading: string;
  readonly names: readonly string[];
  /** Where the names come from, for messages: "MarkerLocation". */
  readonly source: string;
}

/** The backticked names in the first column of the table under `heading`. */
export function tableNames(markdown: string, heading: string, doc: string): string[] {
  return tableRows(section(markdown, heading, doc)).flatMap(([first = ""]) => backticked(first));
}

/** How `listed` differs from `table.names`: missing, extra and repeated names. */
export function tableProblems(table: ReferenceTable, listed: readonly string[]): string[] {
  const where = `${table.doc} ${table.heading}`;
  if (listed.length === 0) return [`${where}: no table of names`];
  return [
    ...missingFrom(listed, table.names).map(
      (name) => `${where}: \`${name}\` is in ${table.source} but not in the table`,
    ),
    ...missingFrom(table.names, listed).map(
      (name) => `${where}: \`${name}\` is in the table but not in ${table.source}`,
    ),
    ...repeated(listed).map((name) => `${where}: \`${name}\` is listed twice`),
  ];
}

/** Every reference table's problems, each page read once with `read`. */
export function referenceProblems(
  tables: readonly ReferenceTable[],
  read: (file: string) => string = readRootFile,
): string[] {
  const docs = new Set(tables.map(({ doc }) => doc));
  const pages = new Map(Array.from(docs, (doc) => [doc, read(doc)]));
  return tables.flatMap((table) =>
    tableProblems(table, tableNames(pages.get(table.doc) ?? "", table.heading, table.doc)),
  );
}

/** The names `names` holds more than once, each once. */
function repeated(names: readonly string[]): string[] {
  return [...new Set(names.filter((name, index) => names.indexOf(name) !== index))];
}
