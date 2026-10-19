import { INERT_SCRIPT_TYPE } from "./page-scripts.ts";

const DOCTYPE = /^\s*<!doctype html>\s*/i;

/** A script's opening tag, with its attributes. */
const SCRIPT_TAG = /<script\b([^>]*)>/g;

/** `html` without its leading doctype: the site's page has its own. */
export function withoutDoctype(html: string): string {
  return html.replace(DOCTYPE, "");
}

/**
 * Each inline script made inert, keeping a module's type to run it with (`runPageScripts`); any
 * other script is refused.
 */
export function inertScripts(html: string): string {
  return html.replaceAll(SCRIPT_TAG, (_tag, attributes: string) => {
    if (attributes === "") return `<script type="${INERT_SCRIPT_TYPE}">`;
    if (attributes === ' type="module"') {
      return `<script type="${INERT_SCRIPT_TYPE}" data-type="module">`;
    }
    throw new Error(`the site runs an example's inline scripts only, not <script${attributes}>`);
  });
}

/** `text` as a quoted attribute's value. */
export function attributeValue(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

/**
 * The one match of `pattern`, a global regex, in `html`; `rule`, what an example must have once,
 * is the error when it has none or more.
 */
export function requireOnce(html: string, pattern: RegExp, rule: string): string {
  const matches = html.match(pattern) ?? [];
  const [match] = matches;
  if (matches.length !== 1 || match === undefined) {
    throw new Error(`${rule}: this one has ${matches.length}`);
  }
  return match;
}
