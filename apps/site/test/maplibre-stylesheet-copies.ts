import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** A rule only MapLibre's stylesheet holds. */
const MAPLIBRE_RULE = ".maplibregl-canvas";
/** The frame `MapFrame.astro` and `HeldMaps.astro` draw a page's maps in. */
const MAP_FRAME = /class="[^"]*\bmap-frame\b/;
const STYLESHEET_LINK = /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g;
const STYLE_BLOCK = /<style[^>]*>([\s\S]*?)<\/style>/g;

/** Where MapLibre's stylesheet is on a built site: the pages drawing maps, and those wrongly. */
export interface MapLibreSheetCopies {
  /** Each page with a map frame, by its path under the build's folder. */
  readonly mapPages: readonly string[];
  /** "path: copies, not expected" for each page carrying it but once with a map, or at all without. */
  readonly misplaced: readonly string[];
}

/** Where the built site in `dir` carries MapLibre's stylesheet, read from its files (W70). */
export function mapLibreSheetCopies(dir: string): MapLibreSheetCopies {
  const read = readerOf(dir);
  const pages = globSync("**/*.html", { cwd: dir }).map((path) => ({ path, html: read(path) }));
  const mapPages = pages.filter(({ html }) => MAP_FRAME.test(html)).map(({ path }) => path);
  const misplaced = pages.flatMap(({ path, html }) => {
    const copies = stylesheetsOf(html, read).filter((css) => css.includes(MAPLIBRE_RULE)).length;
    const expected = mapPages.includes(path) ? 1 : 0;
    return copies === expected ? [] : [`${path}: ${copies}, not ${expected}`];
  });
  return { mapPages, misplaced };
}

/** The text of the built file at `path`, read once however many pages link it. */
function readerOf(dir: string): (path: string) => string {
  const read = new Map<string, string>();
  return (path) => {
    if (!read.has(path)) read.set(path, readFileSync(join(dir, path), "utf8"));
    return read.get(path) as string;
  };
}

/** The stylesheets `html` gives its page: each same-site linked one's text, then each `<style>`'s. */
function stylesheetsOf(html: string, read: (path: string) => string): string[] {
  const linked = [...html.matchAll(STYLESHEET_LINK)]
    .map(([, href = ""]) => href)
    .filter((href) => href.startsWith("/"))
    .map(read);
  return [...linked, ...[...html.matchAll(STYLE_BLOCK)].map(([, css = ""]) => css)];
}
