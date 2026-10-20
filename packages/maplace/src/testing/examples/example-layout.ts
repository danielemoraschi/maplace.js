import { expect } from "vitest";

// What a reader sees of an example version: where its map, list and page controls sit, and how
// they look. Parts are matched by role and text, never by id, since each version names its own.

/** One part of a version as a reader sees it: its box within the version, and its look. */
export interface LookPart {
  /** The role and text that match the part across versions, numbered when repeated. */
  readonly key: string;
  readonly box: Readonly<Record<(typeof BOX_SIDES)[number], number>>;
  readonly style: Readonly<Record<(typeof SEEN_STYLES)[number], string>>;
}

/** The list a version shows: maplace's listbox, a native select, or a page's radio group. */
export const LIST_SELECTOR = "[role=listbox], select, fieldset:has(input[type=radio])";
/** A list's entries, each a location (or "fit all") a reader picks. */
const ENTRY = "[role=option]";
/** A page's own controls, readouts and text blocks: what it puts around the map. */
const PAGE_PART = "button, label, output, aside, p, h1, h2, h3, h4, h5, h6, ol, ul";
const SEEN_STYLES = [
  "fontSize",
  "fontWeight",
  "padding",
  "borderTop",
  "borderRight",
  "borderBottom",
  "borderLeft",
  "backgroundColor",
  "color",
] as const;
const BOX_SIDES = ["x", "y", "width", "height"] as const;
const WORDS_IN_KEY = 40;
const TOLERANCE_PX = 1;

/** The parts of the version inside `root` whose map is drawn in `map`, in markup order. */
export function layoutOf(root: Element, map: Element): LookPart[] {
  const origin = root.getBoundingClientRect();
  const seen = new Map<string, number>();
  return partsOf(root, map).map(({ element, name }) => {
    const repeats = seen.get(name) ?? 0;
    seen.set(name, repeats + 1);
    return {
      key: repeats === 0 ? name : `${name} #${repeats + 1}`,
      box: boxIn(element, origin),
      style: styleOf(element),
    };
  });
}

/**
 * `actual` has the parts of `expected`, each placed within a pixel of it and looking the same.
 * Parts are matched by key, so a page may place them in another order than its markup's (tabs'
 * flex `order`).
 */
export function expectLooksAlike(actual: readonly LookPart[], expected: readonly LookPart[]): void {
  const keysOf = (parts: readonly LookPart[]) =>
    parts.map(({ key }) => key).sort((a, b) => a.localeCompare(b));
  expect(keysOf(actual)).toEqual(keysOf(expected));
  const actualByKey = new Map(actual.map((part) => [part.key, part]));
  for (const expectedPart of expected) {
    const actualPart = actualByKey.get(expectedPart.key) as LookPart;
    for (const side of BOX_SIDES) {
      const offBy = Math.abs(actualPart.box[side] - expectedPart.box[side]);
      expect(
        offBy,
        `${expectedPart.key}: ${side} ${actualPart.box[side]}, expected ${expectedPart.box[side]}`,
      ).toBeLessThanOrEqual(TOLERANCE_PX);
    }
    expect(actualPart.style, expectedPart.key).toEqual(expectedPart.style);
  }
}

interface Part {
  readonly element: Element;
  readonly name: string;
}

/**
 * The map, the list and its entries, and the page's parts, leaving out what is drawn inside the map
 * or a list. The map and a list are named by role alone: their words change as they load.
 */
function partsOf(root: Element, map: Element): Part[] {
  const lists = [...root.querySelectorAll(LIST_SELECTOR)];
  const entries = [...root.querySelectorAll(ENTRY)];
  const pageParts = [...root.querySelectorAll(PAGE_PART)].filter(
    (element) => !map.contains(element) && !lists.some((list) => list.contains(element)),
  );
  const parts = [
    { element: map, name: "map" },
    ...lists.map((element) => ({ element, name: roleOf(element) })),
    ...entries.map((element) => ({ element, name: `option ${wordsOf(element)}` })),
    ...pageParts.map((element) => ({ element, name: `${roleOf(element)} ${wordsOf(element)}` })),
  ];
  return parts.filter(({ element }) => isShown(element));
}

function isShown(element: Element): boolean {
  return element.getClientRects().length > 0;
}

function roleOf(element: Element): string {
  return element.getAttribute("role") ?? element.localName;
}

function wordsOf(element: Element): string {
  return (element.textContent ?? "").replaceAll(/\s+/g, " ").trim().slice(0, WORDS_IN_KEY);
}

function boxIn(element: Element, origin: DOMRect): LookPart["box"] {
  const { x, y, width, height } = element.getBoundingClientRect();
  return { x: x - origin.x, y: y - origin.y, width, height };
}

function styleOf(element: Element): LookPart["style"] {
  const computed = getComputedStyle(element);
  return Object.fromEntries(SEEN_STYLES.map((name) => [name, computed[name]])) as LookPart["style"];
}
