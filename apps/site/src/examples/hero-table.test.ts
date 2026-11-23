import { describe, expect, it } from "vitest";
import { HERO_TABLE, heroCards, hiddenBelowWidths, shownFromWidths } from "./hero-table.ts";

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

  it("keeps every card within the seven rows, the table's height wherever it lies", () => {
    expect(HERO_TABLE.every(({ row }) => row >= 1 && row <= 7)).toBe(true);
  });

  it("lays a card past the four columns only from a width", () => {
    const outside = HERO_TABLE.filter(({ column }) => column > 4);
    expect(outside.every(({ shownFrom }) => shownFrom !== undefined)).toBe(true);
  });

  it("lands the cards a wider screen brings after the others, so a narrower one lands as before", () => {
    const cards = heroCards([
      { name: "simple", row: 1, column: 5, shownFrom: 1700 },
      { name: "route", row: 2, column: 1 },
      { name: "brand", row: 1, column: 1 },
    ]);
    expect(cards.map(({ name }) => name)).toEqual(["brand", "route", "simple"]);
  });

  it("shows every example on the table once", () => {
    const names = HERO_TABLE.map(({ name }) => name);
    expect(new Set(names).size).toBe(names.length);
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

  it("gives the widths cards are laid from, in px, once each", () => {
    expect(shownFromWidths(HERO_TABLE)).toEqual([1700, 2000, 2400, 2600]);
  });

  it("names a card whose example has no page", () => {
    expect(() => heroCards([{ name: "nowhere", row: 1, column: 1 }])).toThrow(
      "the hero table's card nowhere has no example page",
    );
  });
});
