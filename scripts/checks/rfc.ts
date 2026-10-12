import { readFileSync } from "node:fs";
import { API_LISTS } from "../../packages/maplace/src/__typetests__/api-lists.ts";

const RFC = "docs/rfc-1.0.md";

export type ApiLists = { readonly [K in keyof typeof API_LISTS]: readonly string[] };

/** Where each list lives in the RFC and in the types, for messages. */
const PLACES: Readonly<
  Record<keyof ApiLists, { item: string; rfcPlace: string; typeName: string }>
> = {
  misuseCodes: { item: "misuse code", rfcPlace: "§3 Errors table", typeName: "MisuseCode" },
  runtimeCodes: {
    item: "runtime code",
    rfcPlace: "§3 Errors, runtime failures",
    typeName: "RuntimeCode",
  },
  events: { item: "event", rfcPlace: "§3 Shape, Events", typeName: "MaplaceEventName" },
  capabilities: { item: "capability", rfcPlace: "§3 Glossary", typeName: "Capability" },
};

// A backticked name, e.g. `select`.
const BACKTICKED = /`([^`]+)`/g;
// A first table cell holding one backticked code, e.g. | `invalid-input` |.
const CODE_ROW = /^\s*\| `([a-z-]+)` \|/gm;

/** Drift between the frozen RFC and the declarations (T11). */
export function check(): string[] {
  const rfc = listsInRfc(readFileSync(RFC, "utf8"));
  return differences(rfc, API_LISTS).map((problem) => `${RFC}: ${problem}`);
}

export function differences(rfc: ApiLists, types: ApiLists): string[] {
  return (Object.keys(PLACES) as (keyof ApiLists)[]).flatMap((key) => {
    const { item, rfcPlace, typeName } = PLACES[key];
    return [
      ...missingFrom(types[key], rfc[key]).map(
        (name) => `${item} "${name}" is in the RFC (${rfcPlace}) but not in ${typeName}`,
      ),
      ...missingFrom(rfc[key], types[key]).map(
        (name) => `${item} "${name}" is in ${typeName} but not in the RFC (${rfcPlace})`,
      ),
    ];
  });
}

export function listsInRfc(markdown: string): ApiLists {
  const errors = section(markdown, "### Errors");
  const capabilityRow = lineStarting(section(markdown, "### Glossary"), "| capability |");
  return {
    misuseCodes: captures(errors, CODE_ROW),
    runtimeCodes: namesListed(lineStarting(errors, "- **Runtime failures are events**")),
    events: namesListed(lineStarting(section(markdown, "### Shape"), "- **Events**:")),
    capabilities: wordsAfterColon(capabilityRow),
  };
}

/** From `heading` to the next heading. */
function section(markdown: string, heading: string): string {
  const lines = markdown.split("\n");
  const start = lines.indexOf(heading);
  if (start === -1) throw new Error(`RFC: no "${heading}" section`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("#"));
  return rest.slice(0, end === -1 ? undefined : end).join("\n");
}

function lineStarting(text: string, prefix: string): string {
  const line = text.split("\n").find((candidate) => candidate.trimStart().startsWith(prefix));
  if (line === undefined) throw new Error(`RFC: no line starting "${prefix}"`);
  return line;
}

/** The backticked names a line lists: outside parentheses, before its first sentence ends. */
function namesListed(line: string): string[] {
  const listing = line.replace(/\([^)]*\)/g, "").split(". ")[0] ?? "";
  return captures(listing, BACKTICKED);
}

/** `| capability | … support: route, cluster |` → `["route", "cluster"]`. */
function wordsAfterColon(row: string): string[] {
  const listing = row.split(":").at(-1) ?? "";
  return listing
    .split(/[,|]/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function captures(text: string, regex: RegExp): string[] {
  return Array.from(text.matchAll(regex), ([, captured]) => captured ?? "");
}

function missingFrom(list: readonly string[], candidates: readonly string[]): string[] {
  return candidates.filter((candidate) => !list.includes(candidate));
}
