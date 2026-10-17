import { INERT_SCRIPT_TYPE } from "./page-scripts.ts";

/** An example page's map, from its opening tag to its closing one. */
const MAP = /<maplace-map\b[\s\S]*?<\/maplace-map>/g;

/** Where an example page has the reader put their key. */
const KEY_PLACEHOLDER = ' api-key="YOUR_KEY"';

const DOCTYPE = /^\s*<!doctype html>\s*/i;

/** The page's CDN script, which the site's own bundle stands in for. */
const CDN_SCRIPT = /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/maplace@[^"]+"><\/script>\s*/g;

/** A script's opening tag, with its attributes. */
const SCRIPT_TAG = /<script\b([^>]*)>/g;

/**
 * An example page as the site runs it, beside nine others: its map held until the visitor
 * consents (`release()`), with the site's key, or none when it has none; its own scripts inert
 * until then (`runPageScripts`); its doctype and CDN script left out, since the site's bundle
 * defines the element. Everything else stays as written, in order.
 */
export function livePage(pageHtml: string, apiKey: string | undefined): string {
  const map = onlyMapOf(pageHtml);
  const held = heldMap(map, apiKey);
  const [before = "", after = ""] = pageHtml.split(map);
  const head = withoutCdnScript(before.replace(DOCTYPE, ""));
  return `${inertScripts(head)}${held}${inertScripts(after)}`;
}

function onlyMapOf(pageHtml: string): string {
  const maps = pageHtml.match(MAP) ?? [];
  const [map] = maps;
  if (maps.length !== 1 || map === undefined) {
    throw new Error(`an example page has one <maplace-map>; this one has ${maps.length}`);
  }
  return map;
}

function heldMap(map: string, apiKey: string | undefined): string {
  if (map.split(KEY_PLACEHOLDER).length !== 2) {
    throw new Error(`an example's map has the key placeholder${KEY_PLACEHOLDER} once`);
  }
  const key = apiKey === undefined ? "" : ` api-key="${attributeValue(apiKey)}"`;
  return map.replace(KEY_PLACEHOLDER, key).replace("<maplace-map", "<maplace-map hold");
}

function withoutCdnScript(head: string): string {
  const scripts = head.match(CDN_SCRIPT) ?? [];
  if (scripts.length !== 1) {
    throw new Error(`an example page loads the CDN script once, before its map: ${scripts.length}`);
  }
  return head.replaceAll(CDN_SCRIPT, "");
}

/** Each script made inert, keeping a module's type to run it with; any other script is refused. */
function inertScripts(html: string): string {
  return html.replaceAll(SCRIPT_TAG, (_tag, attributes: string) => {
    if (attributes === "") return `<script type="${INERT_SCRIPT_TYPE}">`;
    if (attributes === ' type="module"') {
      return `<script type="${INERT_SCRIPT_TYPE}" data-type="module">`;
    }
    throw new Error(`the site runs an example's inline scripts only, not <script${attributes}>`);
  });
}

function attributeValue(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}
