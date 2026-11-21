// The home page's table of examples (W66): which example lies in which cell of the tilted grid,
// the prototype's composition. `HeroTable.astro` lays them out.
import type { ImageMetadata } from "astro";
import { thumbnailOf } from "./example-images.ts";
import { findExamplePage } from "./example-sections.ts";

/** The narrowest screen the table shows on, beside the copy: on a phone it is left off. */
export const TABLE_FROM = 901;

/**
 * From where the table lies beside the copy (`TABLE_FROM`), the widths in px below which a card
 * would run more than about 30px under the copy and so is left off: the prototype's, but for its
 * second row's third cell and circles', which this page's copy pushes to 1100 and 1200.
 */
export type HiddenBelow = 1100 | 1200 | 1260;

/** A card on the table: its example, its cell (from 1, four columns), and where it steps out. */
export interface HeroCard {
  readonly name: string;
  readonly row: number;
  readonly column: number;
  readonly hiddenBelow?: HiddenBelow;
}

/**
 * The prototype's table, its cells and their widths, with the cards the user placed (2026-11-21):
 * choropleth, route, the heatmap, the custom popup, flights and the team around the world among
 * them, search, markers and link to a place at its foot; polygon, with no cell left, off it.
 */
export const HERO_TABLE: readonly HeroCard[] = [
  { name: "whats-on", row: 1, column: 3, hiddenBelow: 1260 },
  { name: "choropleth", row: 1, column: 4 },
  { name: "route", row: 2, column: 3, hiddenBelow: 1100 },
  { name: "earthquakes", row: 2, column: 4 },
  { name: "circles", row: 3, column: 2, hiddenBelow: 1200 },
  { name: "brand", row: 3, column: 3 },
  { name: "tags", row: 3, column: 4 },
  { name: "trade-lanes", row: 4, column: 1 },
  { name: "flights", row: 4, column: 2 },
  { name: "popups", row: 4, column: 3 },
  { name: "team", row: 4, column: 4 },
  { name: "css-markers", row: 5, column: 1 },
  { name: "menu", row: 5, column: 2 },
  { name: "mixed", row: 5, column: 3 },
  { name: "live-data", row: 5, column: 4 },
  { name: "styled", row: 6, column: 1 },
  { name: "polyline", row: 6, column: 2 },
  { name: "this-area", row: 6, column: 3 },
  { name: "tabs", row: 6, column: 4 },
  { name: "big", row: 7, column: 2 },
  { name: "search", row: 7, column: 3 },
  { name: "markers", row: 7, column: 4 },
  { name: "link-to-place", row: 7, column: 1 },
];

/** A card with the picture it shows: its example's thumbnail. */
export interface PlacedCard extends HeroCard {
  readonly thumbnail: ImageMetadata;
}

/**
 * `table`'s cards in reading order, each with its example's thumbnail; throws, naming the card,
 * for one lacking an example or a thumbnail, or lying on another's cell.
 */
export function heroCards(table: readonly HeroCard[]): readonly PlacedCard[] {
  refuseSharedCells(table);
  return [...table].sort(inReadingOrder).map(placedCard);
}

/** The widths, in px, below which some card steps out (`HiddenBelow`), smallest first. */
export function hiddenBelowWidths(table: readonly HeroCard[]): readonly number[] {
  const widths = table.flatMap(({ hiddenBelow }) => (hiddenBelow ? [hiddenBelow] : []));
  return [...new Set(widths)].sort((a, b) => a - b);
}

/** Row by row, left to right: the order the cards land in, whatever the table's order. */
function inReadingOrder(a: HeroCard, b: HeroCard): number {
  return a.row - b.row || a.column - b.column;
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
