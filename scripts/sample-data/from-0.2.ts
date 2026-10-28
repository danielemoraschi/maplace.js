import type { Location } from "../../packages/maplace/src/location.ts";

/** A location as 0.2's `ajax.php` served it. */
interface LegacyLocation {
  readonly lat: number;
  readonly lon: number;
  readonly title?: string;
  readonly html?: string;
  /** `false`: no popup, whatever the `html`. */
  readonly show_infowindow?: boolean;
  readonly circle_options?: { readonly radius: number };
}

interface LegacyGroup {
  readonly title: string;
  readonly type: string;
  readonly locations: readonly LegacyLocation[];
}

/** One of the `mixed` example's data sets: 0.2's group of that letter. */
export interface MixedGroup {
  readonly letter: string;
  readonly locations: readonly Location[];
}

/** The groups the `mixed` example swaps between, as 0.2's demo did, by letter: each one's kind. */
const MIXED_GROUPS: Readonly<Record<string, string>> = {
  a: "Markers",
  b: "More markers",
  c: "Route",
  d: "Area",
  e: "Circle",
};

/** One `echo '{…}';` of `ajax.php`: a group as JSON. */
const ECHOED_GROUP = /echo '(\{[^']+\})';/g;

/** One point of `4k.js`, written `{lat:27.91,lon:-135.51}`. */
const LEGACY_POINT = /\{lat:(-?[\d.]+),lon:(-?[\d.]+)\}/g;

/**
 * The `mixed` example's data sets, from 0.2's `website/data/ajax.php`: groups A and B as
 * markers, C's directions as markers (the example routes through them), D's points as one
 * polygon and E as a circle, each group named by its kind (`MIXED_GROUPS`). `html` becomes
 * plain-text `content` (the page has no sanitizer), none where `show_infowindow` is false; `lon`
 * is `lng`, and 0.2's icons, which were Google's own `http:` images, are left out.
 */
export function mixedGroupsFromAjax(php: string): MixedGroup[] {
  const groups = Array.from(php.matchAll(ECHOED_GROUP), ([, json]) =>
    JSON.parse(json ?? "{}"),
  ) as LegacyGroup[];
  return Object.entries(MIXED_GROUPS).map(([letter, kind]) => {
    const group = { ...groupTitled(groups, `Group ${letter.toUpperCase()}`), title: kind };
    return { letter, locations: locationsOf(group, letter) };
  });
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

/** A group's locations, with ids from its letter and 1-based places. */
function locationsOf(group: LegacyGroup, letter: string): Location[] {
  if (group.type === "polygon") return [polygonOf(group, letter)];
  return group.locations.map((legacy, index) => {
    const shared = {
      id: `${letter}${index + 1}`,
      group: group.title,
      title: legacy.title,
      ...(legacy.show_infowindow === false ? {} : { content: textOf(legacy.html ?? "") }),
    };
    const { lat, lon: lng } = legacy;
    return group.type === "circle"
      ? { ...shared, type: "circle", center: { lat, lng }, radius: radiusOf(legacy) }
      : { ...shared, lat, lng };
  });
}

/** A polygon group's points as one area, named after the group. */
function polygonOf({ title, locations }: LegacyGroup, letter: string): Location {
  const path = locations.map(({ lat, lon: lng }) => ({ lat, lng }));
  return { id: `${letter}1`, group: title, title, type: "polygon", path };
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
