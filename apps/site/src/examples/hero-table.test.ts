import { describe, expect, it } from "vitest";
import { HERO_TABLE, heroCards, hiddenBelowWidths } from "./hero-table.ts";

describe("the home page's table of examples", () => {
  it("lays only examples with a page and a thumbnail, every card of the table", () => {
    expect(
      heroCards(HERO_TABLE)
        .map(({ name }) => name)
        .sort(),
    ).toEqual(HERO_TABLE.map(({ name }) => name).sort());
  });

  it("lays the cards in reading order, row by row, left to right, whatever the table's order", () => {
    const cards = heroCards([
      { name: "route", row: 2, column: 1 },
      { name: "simple", row: 1, column: 2 },
      { name: "brand", row: 1, column: 1 },
    ]);
    expect(cards.map(({ name }) => name)).toEqual(["brand", "simple", "route"]);
  });

  it("keeps every card within the four columns", () => {
    expect(HERO_TABLE.every(({ column }) => column >= 1 && column <= 4)).toBe(true);
  });

  it("names two cards laid on one cell", () => {
    const table = [
      { name: "simple", row: 1, column: 1 },
      { name: "route", row: 1, column: 1 },
    ];
    expect(() => heroCards(table)).toThrow(
      "the hero table's cards simple and route share cell 1/1",
    );
  });

  it("gives the widths cards step out below, in px, once each", () => {
    expect(
      hiddenBelowWidths([...HERO_TABLE, { name: "x", row: 9, column: 1, hiddenBelow: 1100 }]),
    ).toEqual([1100, 1200, 1260]);
  });

  it("names a card whose example has no page", () => {
    expect(() => heroCards([{ name: "nowhere", row: 1, column: 1 }])).toThrow(
      "the hero table's card nowhere has no example page",
    );
  });
});
