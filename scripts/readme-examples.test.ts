import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT, readRootFile } from "./build/package.ts";
import { SHOTS, THUMBNAIL } from "./example-shots/shot-sizes.ts";

const DRAWING = "scripts/readme-examples.html";
const html = readRootFile(DRAWING);
/** Where the drawing's `<base href>` points its cards' pictures. */
const base = resolve(ROOT, dirname(DRAWING), /<base href="([^"]+)"/.exec(html)?.[1] ?? "");
/** Each `<img>` of the README's picture, in the drawing's order: its picture, and whether it's large. */
const cards = Array.from(html.matchAll(/<img\b[^>]*>/g), ([tag]) => ({
  src: /\bsrc="([^"]+)"/.exec(tag)?.[1] ?? "",
  large: /\bclass="large"/.test(tag),
}));
const largeCount = cards.filter(({ large }) => large).length;

describe("the README's picture of the examples (W73)", () => {
  it("draws only examples with a thumbnail", () => {
    expect(base).toBe(join(SHOTS, THUMBNAIL.folder));
    const outside = cards.filter(({ src }) => dirname(join(base, src)) !== base);
    expect(outside).toEqual([]);
    expect(cards.filter(({ src }) => !existsSync(join(base, src)))).toEqual([]);
  });

  it("draws each example once", () => {
    const sources = cards.map(({ src }) => src);
    expect(sources.length).toBeGreaterThan(0);
    expect(new Set(sources).size).toBe(sources.length);
  });

  it("lays every large example before the small ones", () => {
    expect(largeCount).toBeGreaterThan(0);
    expect(cards.findIndex(({ large }) => !large)).toBe(largeCount);
  });

  it("fills every row: large cards in pairs, four small ones beside each", () => {
    expect(largeCount % 2).toBe(0);
    expect(cards.length - largeCount).toBe(4 * largeCount);
  });
});
