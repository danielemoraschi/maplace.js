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

/** Every `Link` header of the `_headers` file `text`, under the rule that sets it. */
export function linkRules(text: string): LinkRule[] {
  const links: LinkRule[] = [];
  let pattern = "";
  for (const line of text.split("\n")) {
    if (line.startsWith("#") || line.trim() === "") continue;
    if (!line.startsWith(" ")) pattern = line.trim();
    const link = LINK.exec(line.trim());
    if (link !== null) {
      const [, target = "", rel = ""] = link;
      links.push({ pattern, rel, target, match: matcher(pattern) });
    }
  }
  return links;
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
