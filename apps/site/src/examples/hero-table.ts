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

/** The widths in px a card past the four columns is laid from, its picture unfetched below. */
export type ShownFrom = 1700 | 2000 | 2400 | 2600;

/**
 * A card on the table: its example, its cell (from 1, in seven rows), where it steps out, and,
 * past the four columns, from where it is laid.
 */
export interface HeroCard {
  readonly name: string;
  readonly row: number;
  readonly column: number;
  readonly hiddenBelow?: HiddenBelow;
  readonly shownFrom?: ShownFrom;
}

/**
 * The prototype's table, its cells and their widths, with the cards where the user placed them,
 * and past its top right the cells a wider screen brings into view below the page's header, each
 * laid from about the width that shows a part of it (`home-hero.test.ts` holds each to that).
 */
export const HERO_TABLE: readonly HeroCard[] = [
  { name: "share-by-country", row: 1, column: 3, hiddenBelow: 1260 },
  { name: "choropleth", row: 1, column: 4 },
  { name: "route", row: 2, column: 3, hiddenBelow: 1100 },
  { name: "earthquakes", row: 2, column: 4 },
  { name: "circles", row: 3, column: 2, hiddenBelow: 1200 },
  { name: "audience", row: 3, column: 3 },
  { name: "whats-on", row: 3, column: 4 },
  { name: "trade-lanes", row: 4, column: 1 },
  { name: "flights", row: 4, column: 2 },
  { name: "popups", row: 4, column: 3 },
  { name: "team", row: 4, column: 4 },
  { name: "css-markers", row: 5, column: 1 },
  { name: "menu", row: 5, column: 2 },
  { name: "brand", row: 5, column: 3 },
  { name: "big", row: 5, column: 4 },
  { name: "simple", row: 6, column: 1 },
  { name: "polyline", row: 6, column: 2 },
  { name: "this-area", row: 6, column: 3 },
  { name: "tabs", row: 6, column: 4 },
  { name: "live-data", row: 7, column: 2 },
  { name: "search", row: 7, column: 3 },
  { name: "markers", row: 7, column: 4 },
  { name: "link-to-place", row: 7, column: 1 },
  { name: "offices", row: 1, column: 5, shownFrom: 1700 },
  { name: "bubbles", row: 2, column: 5, shownFrom: 1700 },
  { name: "nearest", row: 3, column: 5, shownFrom: 1700 },
  { name: "tags", row: 2, column: 6, shownFrom: 2000 },
  { name: "click-to-add", row: 3, column: 6, shownFrom: 2000 },
  { name: "geojson", row: 4, column: 5, shownFrom: 2000 },
  { name: "mixed", row: 4, column: 6, shownFrom: 2400 },
  { name: "custom-list", row: 5, column: 5, shownFrom: 2400 },
  { name: "side-list", row: 4, column: 7, shownFrom: 2600 },
  { name: "styled", row: 5, column: 6, shownFrom: 2600 },
  { name: "polygon", row: 6, column: 5, shownFrom: 2600 },
];

/** A card with the picture it shows: its example's thumbnail. */
export interface PlacedCard extends HeroCard {
  readonly thumbnail: ImageMetadata;
}

/**
 * `table`'s cards in the order they land, each with its example's thumbnail; throws, naming the
 * card, for one lacking an example or a thumbnail, or lying on another's cell.
 */
export function heroCards(table: readonly HeroCard[]): readonly PlacedCard[] {
  refuseSharedCells(table);
  return [...table].sort(inLandingOrder).map(placedCard);
}

/** The widths, in px, below which some card steps out (`HiddenBelow`), smallest first. */
export function hiddenBelowWidths(table: readonly HeroCard[]): readonly number[] {
  return distinctWidths(table.map(({ hiddenBelow }) => hiddenBelow));
}

/** The widths, in px, from which some card is laid (`ShownFrom`), smallest first. */
export function shownFromWidths(table: readonly HeroCard[]): readonly number[] {
  return distinctWidths(table.map(({ shownFrom }) => shownFrom));
}

function distinctWidths(widths: readonly (number | undefined)[]): readonly number[] {
  const defined = widths.filter((width) => width !== undefined);
  return [...new Set(defined)].sort((a, b) => a - b);
}

/**
 * Row by row, left to right, whatever the table's order, those a wider screen brings last: a
 * narrower one sees its cards land as they always did.
 */
function inLandingOrder(a: HeroCard, b: HeroCard): number {
  return (a.shownFrom ?? 0) - (b.shownFrom ?? 0) || a.row - b.row || a.column - b.column;
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
