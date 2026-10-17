import { readFileSync } from "node:fs";
import { API_LISTS } from "../../packages/maplace/src/__typetests__/api-lists.ts";
import { backticked, captures, section } from "./markdown.ts";

export const RFC = "docs/rfc-1.0.md";

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

// A first table cell holding one backticked code, e.g. | `invalid-input` |.
const CODE_ROW = /^[ \t]*\| `([a-z-]+)` \|/gm;

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
  const errors = section(markdown, "### Errors", RFC);
  const capabilityRow = lineStarting(section(markdown, "### Glossary", RFC), "| capability |");
  return {
    misuseCodes: captures(errors, CODE_ROW),
    runtimeCodes: namesListed(lineStarting(errors, "- **Runtime failures are events**")),
    events: namesListed(lineStarting(section(markdown, "### Shape", RFC), "- **Events**:")),
    capabilities: wordsAfterColon(capabilityRow),
  };
}

function lineStarting(text: string, prefix: string): string {
  const line = text.split("\n").find((candidate) => candidate.trimStart().startsWith(prefix));
  if (line === undefined) throw new Error(`${RFC}: no line starting "${prefix}"`);
  return line;
}

/** The backticked names a line lists: outside parentheses, before its first sentence ends. */
function namesListed(line: string): string[] {
  const listing = line.replaceAll(/\([^()]*\)/g, "").split(". ")[0] ?? "";
  return backticked(listing);
}

/** `| capability | … support: route, cluster |` → `["route", "cluster"]`. */
function wordsAfterColon(row: string): string[] {
  const listing = row.split(":").at(-1) ?? "";
  return listing
    .split(/[,|]/)
    .map((word) => word.trim())
    .filter(Boolean);
}

export function missingFrom(list: readonly string[], candidates: readonly string[]): string[] {
  return candidates.filter((candidate) => !list.includes(candidate));
}
