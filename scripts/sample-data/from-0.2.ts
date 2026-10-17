import type { Location } from "../../packages/maplace/src/location.ts";

/** A location as 0.2's `ajax.php` served it. */
interface LegacyLocation {
  readonly lat: number;
  readonly lon: number;
  readonly title?: string;
  readonly html?: string;
  readonly circle_options?: { readonly radius: number };
}

interface LegacyGroup {
  readonly title: string;
  readonly type: string;
  readonly locations: readonly LegacyLocation[];
}

/** The groups the `mixed` example shows: two of markers and one of a circle. */
const MIXED_GROUPS = ["Group A", "Group B", "Group E"] as const;

/** One `echo '{…}';` of `ajax.php`: a group as JSON. */
const ECHOED_GROUP = /echo '(\{[^']+\})';/g;

/** One point of `4k.js`, written `{lat:27.91,lon:-135.51}`. */
const LEGACY_POINT = /\{lat:(-?[\d.]+),lon:(-?[\d.]+)\}/g;

/**
 * The `mixed` example's locations, from 0.2's `website/data/ajax.php`: groups A and B as
 * markers, E as a circle. `html` becomes plain-text `content` (the page has no sanitizer), `lon`
 * is `lng`, and 0.2's icons, which were Google's own `http:` images, are left out.
 */
export function locationsFromAjax(php: string): Location[] {
  const groups = Array.from(php.matchAll(ECHOED_GROUP), ([, json]) =>
    JSON.parse(json ?? "{}"),
  ) as LegacyGroup[];
  return MIXED_GROUPS.flatMap((title) => locationsOf(groupTitled(groups, title)));
}

/** The `big` example's 4,000 points, from 0.2's `website/data/4k.js`: ids from 1-based places. */
export function pointsFrom4k(js: string): Location[] {
  return Array.from(js.matchAll(LEGACY_POINT), ([, lat, lon], index) => ({
    id: `p${index + 1}`,
    lat: Number(lat),
    lng: Number(lon),
  }));
}

function groupTitled(groups: readonly LegacyGroup[], title: string): LegacyGroup {
  const group = groups.find((candidate) => candidate.title === title);
  if (group === undefined) throw new Error(`ajax.php has no "${title}"`);
  return group;
}

function locationsOf({ title: group, type, locations }: LegacyGroup): Location[] {
  const letter = group.at(-1)?.toLowerCase() ?? "";
  return locations.map((legacy, index) => {
    const shared = {
      id: `${letter}${index + 1}`,
      group,
      title: legacy.title,
      content: textOf(legacy.html ?? ""),
    };
    const { lat, lon: lng } = legacy;
    return type === "circle"
      ? { ...shared, type, center: { lat, lng }, radius: radiusOf(legacy) }
      : { ...shared, lat, lng };
  });
}

function radiusOf({ title, circle_options }: LegacyLocation): number {
  if (circle_options === undefined) throw new Error(`the circle "${title}" has no radius`);
  return circle_options.radius;
}

/** `<h3>Content A1</h3><p>Lorem…</p>` → `Content A1 Lorem…`. */
function textOf(html: string): string {
  const [before = "", ...tagged] = html.split("<");
  const texts = tagged.map((part) => part.slice(part.indexOf(">") + 1));
  return [before, ...texts].join(" ").replaceAll(/\s+/g, " ").trim();
}
