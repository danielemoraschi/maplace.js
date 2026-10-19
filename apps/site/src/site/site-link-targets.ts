import { proseLinesOf } from "../../../../scripts/checks/markdown.ts";

/** A page of the site rendered from a repo doc: its route and its Markdown as the site has it. */
export interface DocPage {
  readonly route: string;
  readonly markdown: string;
}

// The target of a link to the site itself: rooted, `](/locations/#markers)`, or to a heading of
// the page, `](#markers)`; a title after it, `](#markers "Markers")`, is no part of it.
const SITE_LINK = /\]\(([/#][^)\s]*)(?:\s+"[^"]*")?\)/g;
// What github-slugger, which Astro uses for heading ids, drops: all but letters, digits, spaces, - and _.
const NOT_IN_SLUG = /[^\p{L}\p{N} _-]/gu;
// An ATX heading's opening: up to three spaces, one to six `#`, then a space or the line's end.
const ATX_HEADING = /^ {0,3}#{1,6}(?:[ \t]+|$)/;
// An ATX heading's optional closing `#`s, after a space: not in its text.
const ATX_CLOSING = /[ \t]+#+[ \t]*$/;
// A link in a heading, `[text](target)`: only its text is in the heading's id.
const LINK = /\[([^\]]*)\]\([^)]*\)/g;

interface SiteLink {
  readonly target: string;
  readonly line: number;
}

/** Each rooted link of `pages`, or link to a heading of its own page, that reaches no page or no heading of it. */
export function brokenSiteLinks(pages: readonly DocPage[]): string[] {
  const slugsByRoute = new Map(
    pages.map(({ route, markdown }) => [route, headingSlugsOf(markdown)]),
  );
  return pages.flatMap(({ route, markdown }) =>
    siteLinksIn(markdown).flatMap(({ target, line }) => {
      const problem = problemOf(rooted(target, route), slugsByRoute);
      return problem === undefined ? [] : [`${route} line ${line}: ${problem}`];
    }),
  );
}

/** The id a heading gets on the site: github-slugger's slug, which Astro uses. */
export function headingSlug(heading: string): string {
  return heading
    .replace(ATX_HEADING, "")
    .replace(ATX_CLOSING, "")
    .replaceAll(LINK, "$1")
    .toLowerCase()
    .replaceAll(NOT_IN_SLUG, "")
    .replaceAll(" ", "-");
}

/** `target`, a link on the page at `route`, as a rooted link: `#markers` → `/locations/#markers`. */
function rooted(target: string, route: string): string {
  return target.startsWith("#") ? `${route}${target}` : target;
}

function problemOf(
  link: string,
  slugsByRoute: ReadonlyMap<string, ReadonlySet<string>>,
): string | undefined {
  const [route = "", anchor] = link.split("#");
  const slugs = slugsByRoute.get(route);
  if (slugs === undefined) return `${route} is no page`;
  if (anchor !== undefined && !slugs.has(anchor)) return `${route} has no heading "#${anchor}"`;
  return undefined;
}

function siteLinksIn(markdown: string): SiteLink[] {
  return proseLinesOf(markdown).flatMap(({ text, line }) =>
    Array.from(text.matchAll(SITE_LINK), ([, target = ""]) => ({ target, line })),
  );
}

/** The ids of the page's headings: a slug taken already gets `-1`, `-2`, … as github-slugger does. */
function headingSlugsOf(markdown: string): ReadonlySet<string> {
  const slugs = new Set<string>();
  for (const { text } of proseLinesOf(markdown).filter(({ text }) => ATX_HEADING.test(text))) {
    slugs.add(untakenSlug(headingSlug(text), slugs));
  }
  return slugs;
}

/** `slug`, or `slug-1`, `slug-2`, … : the first of them not `taken`. */
function untakenSlug(slug: string, taken: ReadonlySet<string>): string {
  let unique = slug;
  for (let count = 1; taken.has(unique); count++) unique = `${slug}-${count}`;
  return unique;
}
