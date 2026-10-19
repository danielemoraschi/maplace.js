import type { MaplaceMapElement } from "../../element/index";
import { importedNodes, parse, rootOf, runScript, withKey } from "./example-dom";
import { recordErrors } from "./page-errors";

/** A page opened in the test document: its map, and what went wrong on it. */
export interface OpenedPage {
  readonly map: MaplaceMapElement;
  /** The element holding the page's nodes. */
  readonly root: HTMLElement;
  /** Errors thrown by the page's scripts, and the map's `maplace-error` details. */
  readonly errors: readonly unknown[];
}

interface PageOptions {
  /** Replaces the pages' `YOUR_KEY`, for a run on real Google Maps. */
  readonly apiKey?: string;
}

/** The one CDN script a page loads, by file name. */
export function cdnScriptOf(html: string): string {
  const sources = [...parse(html).querySelectorAll("script[src]")].map(
    (script) => script.getAttribute("src") ?? "",
  );
  if (sources.length !== 1)
    throw new Error(`a page loads one CDN script, this one ${sources.length}`);
  return sources[0]?.split("/").at(-1) ?? "";
}

/**
 * `html` as the test document's body, its own scripts run: the CDN script is left out, since
 * the test has defined the elements already.
 */
export function openPage(html: string, options: PageOptions = {}): OpenedPage {
  const { maps, roots, errors } = openPages([html], options);
  return { map: maps[0] as MaplaceMapElement, root: roots[0] as HTMLElement, errors };
}

/**
 * Pages opened together in the test document, as a site shows them: each page's map, and the
 * element holding the page, in order.
 */
export interface OpenedPages {
  readonly maps: readonly MaplaceMapElement[];
  readonly roots: readonly HTMLElement[];
  readonly errors: readonly unknown[];
}

/**
 * `htmls` one after another as the test document's body, each in a `<div>` of its own with its
 * styles, then every page's scripts run.
 */
export function openPages(htmls: readonly string[], { apiKey }: PageOptions = {}): OpenedPages {
  const pages = htmls.map((html) => parse(withKey(html, apiKey)));
  // Before the nodes connect: an element reports some misuse as it connects.
  const errors = recordErrors();
  const roots = pages.map((page) => rootOf(importedNodes(page, "style")));
  document.body.replaceChildren(...roots);
  for (const script of document.body.querySelectorAll("script")) runScript(script);
  const maps = [...document.querySelectorAll("maplace-map")];
  if (maps.length !== htmls.length) {
    throw new Error(`${htmls.length} pages opened ${maps.length} maps: each page has one`);
  }
  return { maps, roots, errors };
}
