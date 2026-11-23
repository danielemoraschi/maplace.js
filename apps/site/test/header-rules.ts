import { readFileSync } from "node:fs";

/** A `Link` header of a `_headers` rule: the paths the rule matches, the header's rel and target. */
export interface LinkRule {
  readonly pattern: string;
  readonly rel: string;
  readonly target: string;
  /** What `path` matching `pattern` fills its `:name` placeholders with, or `undefined` if it doesn't match. */
  readonly match: (path: string) => Record<string, string> | undefined;
}

/** Cloudflare's limit on a `_headers` file's rules (developers.cloudflare.com/workers/static-assets/headers). */
export const MAX_HEADER_RULES = 100;

const LINK = /^Link: <([^>]+)>; rel="([^"]+)"/;
const PLACEHOLDER = /:([A-Za-z]\w*)/g;

/** The paths of the `_headers` file `text`'s rules, comments and blank lines left out. */
export function rulePatterns(text: string): string[] {
  return text
    .split("\n")
    .filter((line) => line.trim() !== "" && !line.startsWith("#") && !line.startsWith(" "));
}

/** A header line of a `_headers` file, under the rule's path it follows. */
interface HeaderLine {
  readonly pattern: string;
  readonly line: string;
}

/** Every header line of the `_headers` file `text`, trimmed, comments and blank lines left out. */
function headerLines(text: string): HeaderLine[] {
  const lines: HeaderLine[] = [];
  let pattern = "";
  for (const line of text.split("\n")) {
    if (line.startsWith("#") || line.trim() === "") continue;
    if (line.startsWith(" ")) lines.push({ pattern, line: line.trim() });
    else pattern = line.trim();
  }
  return lines;
}

/**
 * The headers the rules written with `pattern` in the `_headers` file `text` set, by name, as
 * the preview's appended `/*` rule (`ci.yml`) joins the site's: a header set twice keeps the last.
 */
export function ruleHeaders(text: string, pattern: string): Record<string, string> {
  const lines = headerLines(text).filter((header) => header.pattern === pattern);
  return Object.fromEntries(
    lines.map(({ line }) => {
      const colon = line.indexOf(":");
      return [line.slice(0, colon), line.slice(colon + 1).trim()];
    }),
  );
}

/** What the site's `_headers` sets on every response (W81), as the build copies it. */
export const everyResponseHeaders = () =>
  ruleHeaders(readFileSync(new URL("../public/_headers", import.meta.url), "utf8"), "/*");

/** The policy every response carries to report, not block, what it disallows, for now. */
export function reportedPolicy(): string {
  const policy = everyResponseHeaders()["Content-Security-Policy-Report-Only"];
  if (policy === undefined) throw new Error("_headers' /* rule reports no policy");
  return policy;
}

/** Every `Link` header of the `_headers` file `text`, under the rule that sets it. */
export function linkRules(text: string): LinkRule[] {
  return headerLines(text).flatMap(({ pattern, line }) => {
    const link = LINK.exec(line);
    if (link === null) return [];
    const [, target = "", rel = ""] = link;
    return [{ pattern, rel, target, match: matcher(pattern) }];
  });
}

/**
 * The target of the one `Link` of `rel` the rules give `path`, its placeholders filled. Throws when
 * no rule, or more than one, gives it one.
 */
export function linkFor(links: readonly LinkRule[], path: string, rel: string): string {
  const matched = links.flatMap((link) => {
    const values = link.rel === rel ? link.match(path) : undefined;
    return values === undefined ? [] : [{ link, values }];
  });
  const [only] = matched;
  if (matched.length !== 1 || only === undefined) {
    throw new Error(`${matched.length} rules give ${path} a rel="${rel}" Link, not one`);
  }
  return only.link.target.replace(PLACEHOLDER, (_, name: string) => only.values[name] ?? "");
}

/** A rule's path as Cloudflare reads it: `:name` one segment, the rest as written. */
function matcher(pattern: string): LinkRule["match"] {
  const source = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(PLACEHOLDER, "(?<$1>[^/]+)");
  const expression = new RegExp(`^${source}$`);
  return (path) => {
    const found = expression.exec(path);
    return found === null ? undefined : { ...found.groups };
  };
}
