// The home page's table of examples (W66): which example lies in which cell of the tilted grid,
// the prototype's composition. `HeroTable.astro` lays them out.
import type { ImageMetadata } from "astro";
import { thumbnailOf } from "./example-images.ts";
import { findExamplePage } from "./example-sections.ts";

/**
 * From 64rem, where the table lies beside the copy, the width below which a card would run under
 * the copy and so is left off: measured on the copy's text from 1024 to 1920 px wide, with a
 * margin, as where the lede wraps moves it.
 */
export type HiddenBelow = "80rem" | "112.5rem" | "120rem";

/** A card on the table: its example, its cell (from 1, four columns), and where it steps out. */
export interface HeroCard {
  readonly name: string;
  readonly row: number;
  readonly column: number;
  readonly hiddenBelow?: HiddenBelow;
}

export const HERO_TABLE: readonly HeroCard[] = [
  { name: "link-to-place", row: 1, column: 4 },
  { name: "search", row: 2, column: 3, hiddenBelow: "80rem" },
  { name: "whats-on", row: 2, column: 4 },
  { name: "circles", row: 3, column: 2, hiddenBelow: "120rem" },
  { name: "brand", row: 3, column: 3 },
  { name: "tags", row: 3, column: 4 },
  { name: "markers", row: 4, column: 2, hiddenBelow: "112.5rem" },
  { name: "route", row: 4, column: 3 },
  { name: "polygon", row: 4, column: 4 },
  { name: "css-markers", row: 5, column: 1 },
  { name: "menu", row: 5, column: 2 },
  { name: "mixed", row: 5, column: 3 },
  { name: "live-data", row: 5, column: 4 },
  { name: "styled", row: 6, column: 1 },
  { name: "polyline", row: 6, column: 2 },
  { name: "this-area", row: 6, column: 3 },
  { name: "tabs", row: 6, column: 4 },
  { name: "popups", row: 7, column: 1 },
  { name: "big", row: 7, column: 2 },
  { name: "flights", row: 7, column: 3 },
  { name: "trade-lanes", row: 7, column: 4 },
];

/** A card with the picture it shows: its example's thumbnail. */
export interface PlacedCard extends HeroCard {
  readonly thumbnail: ImageMetadata;
}

/**
 * `table`'s cards, each with its example's thumbnail; throws, naming the card, for one lacking an
 * example or a thumbnail, or lying on another's cell.
 */
export function heroCards(table: readonly HeroCard[]): readonly PlacedCard[] {
  refuseSharedCells(table);
  return table.map(placedCard);
}

/** The pixels in a rem, as the site sets none of its own. */
const PX_PER_REM = 16;

/** The widths, in px, below which some card steps out (`HiddenBelow`), smallest first. */
export function hiddenBelowWidths(table: readonly HeroCard[]): readonly number[] {
  const rems = table.flatMap(({ hiddenBelow }) =>
    hiddenBelow ? [Number.parseFloat(hiddenBelow)] : [],
  );
  return [...new Set(rems)].sort((a, b) => a - b).map((rem) => rem * PX_PER_REM);
}

function refuseSharedCells(table: readonly HeroCard[]): void {
  const taken = new Map<string, string>();
  for (const { name, row, column } of table) {
    const cell = `${row}/${column}`;
    const other = taken.get(cell);
    if (other !== undefined) {
      throw new Error(`the hero table's cards ${other} and ${name} share cell ${cell}`);
    }
    taken.set(cell, name);
  }
}

function placedCard(card: HeroCard): PlacedCard {
  const entry = findExamplePage(card.name);
  if (entry === undefined)
    throw new Error(`the hero table's card ${card.name} has no example page`);
  const thumbnail = thumbnailOf(entry.section);
  if (thumbnail === undefined)
    throw new Error(`the hero table's card ${card.name} has no thumbnail`);
  return { ...card, thumbnail };
}
