// Where each export statement starts: `export` at the start of a line.
const EXPORT_KEYWORD = /^export\b/gm;
// The words and marks a declaration starts with: `declare`, `const`, `Name`, `*`, `{`.
const TOKEN = /[\w$]+|[^\s\w$]/g;
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** What may stand before a declaration's kind: `export declare const`, `export async function`. */
const MODIFIERS: ReadonlySet<string> = new Set(["declare", "async", "abstract"]);
/** The declarations that export one name, given right after their kind. */
const DECLARATION_KINDS: ReadonlySet<string> = new Set([
  "function",
  "const",
  "let",
  "var",
  "class",
  "interface",
  "type",
  "enum",
]);

/** The names a module exports, in source order, read from its TypeScript `source`. */
export function exportedNames(source: string): string[] {
  return Array.from(source.matchAll(EXPORT_KEYWORD), ({ index }) =>
    source.slice(index + "export".length).trimStart(),
  ).flatMap(namesOf);
}

/** The names one export statement gives, `statement` being what follows its `export`. */
function namesOf(statement: string): string[] {
  const list = statement.startsWith("type")
    ? statement.slice("type".length).trimStart()
    : statement;
  if (list.startsWith("{")) return namesOfList(list.slice(1, list.indexOf("}")));
  return [declaredName(statement)];
}

/** The name a declaration exports: `const enum Kind` → `Kind`; anything else can't be listed. */
function declaredName(statement: string): string {
  const tokens = firstLine(statement).match(TOKEN) ?? [];
  let at = 0;
  while (MODIFIERS.has(tokens[at] ?? "")) at++;
  const kind = tokens[at++] ?? "";
  if (kind === "const" && tokens[at] === "enum") at++;
  if (kind === "function" && tokens[at] === "*") at++;
  const name = tokens[at] ?? "";
  if (!DECLARATION_KINDS.has(kind) || !IDENTIFIER.test(name)) throw unlistable(statement);
  return name;
}

/** The names an export list gives: `a, type B, c as d` → `a`, `B`, `d`. */
function namesOfList(list: string): string[] {
  return list
    .split(",")
    .map((item) => withoutTypePrefix(item.trim()))
    .filter((item) => item !== "")
    .map((item) => item.split(" as ").at(-1)?.trim() ?? item);
}

function withoutTypePrefix(item: string): string {
  return item.startsWith("type ") ? item.slice("type ".length).trimStart() : item;
}

function firstLine(text: string): string {
  return text.split("\n", 1)[0] ?? "";
}

/** `export *`, `export default`, a namespace, a destructured declaration: no name to list. */
function unlistable(statement: string): Error {
  return new Error(
    `"export ${firstLine(statement)}": an entry must name each export, so it can be listed`,
  );
}
