import type { Location } from "../index";
import { jsonIn, textOf } from "./attribute-values";
import { elementMisuse } from "./element-error";
import { MaplaceLocation } from "./location-element";
import { oncePerTask } from "./once-per-task";
import { onLocationSourceChange } from "./source-changes";

const JSON_SCRIPT = 'script[type="application/json"]';

/** Each script's last parse: the same text gives the same objects, which the store sees unchanged. */
const parsedScripts = new WeakMap<
  HTMLScriptElement,
  { text: string; locations: readonly Location[] }
>();

/**
 * The locations written in `host`: its one inline JSON script, or its `<maplace-location>`
 * children. Both, two scripts, or JSON that isn't an array of locations is misuse.
 */
export function readLocationSource(host: Element): readonly Location[] {
  const scripts = jsonScripts(host);
  const children = locationChildren(host);
  if (scripts.length > 0 && children.length > 0) {
    throw elementMisuse(
      "give locations as <maplace-location> children or as one JSON script, not both",
    );
  }
  if (scripts.length > 1) throw elementMisuse("give locations in one JSON script, not several");
  const [script] = scripts;
  return script === undefined ? children.map((child) => child.location) : parsedLocations(script);
}

/**
 * The URL `src` names, if any. Blank is misuse, as is `src` beside locations written inside the
 * element, which it would hide.
 */
export function srcOf(host: Element): string | undefined {
  const src = textOf(host, "src");
  if (host.querySelector(`:scope > ${JSON_SCRIPT}, :scope > maplace-location`) !== null) {
    throw elementMisuse("give locations through src or inside the element, not both", {
      field: "src",
    });
  }
  return src;
}

/**
 * Calls `onChange` once for the changes made together to where the locations come from: a child
 * added or removed, a `<maplace-location>` changed, the JSON script's text, or `src`. Children the
 * parser adds after the map connects arrive this way too.
 */
export function watchLocationSource(host: Element, onChange: () => void): () => void {
  const schedule = oncePerTask(onChange);
  const scriptWatch = new MutationObserver(schedule);
  const watchScripts = () => {
    scriptWatch.disconnect();
    for (const script of jsonScripts(host)) {
      scriptWatch.observe(script, { childList: true, characterData: true, subtree: true });
    }
  };
  const childrenWatch = new MutationObserver((records) => {
    const changed = sourcesChanged(records);
    if (changed.scripts) watchScripts();
    const srcChanged = records.some(({ type }) => type === "attributes");
    if (changed.scripts || changed.locations || srcChanged) schedule();
  });
  childrenWatch.observe(host, { childList: true, attributeFilter: ["src"] });
  watchScripts();
  const stopListening = onLocationSourceChange(host, schedule);
  return () => {
    childrenWatch.disconnect();
    scriptWatch.disconnect();
    stopListening();
  };
}

/** Which sources the records add or remove: `<maplace-location>` children, JSON scripts. */
function sourcesChanged(records: readonly MutationRecord[]) {
  const changed = { locations: false, scripts: false };
  for (const record of records) {
    for (const nodes of [record.addedNodes, record.removedNodes]) {
      for (const node of nodes) {
        if (node instanceof MaplaceLocation) changed.locations = true;
        else if (node instanceof Element && node.matches(JSON_SCRIPT)) changed.scripts = true;
      }
    }
  }
  return changed;
}

function jsonScripts(host: Element): HTMLScriptElement[] {
  return [...host.querySelectorAll<HTMLScriptElement>(`:scope > ${JSON_SCRIPT}`)];
}

function locationChildren(host: Element): MaplaceLocation[] {
  return [...host.children].filter((child) => child instanceof MaplaceLocation);
}

function parsedLocations(script: HTMLScriptElement): readonly Location[] {
  const { text } = script;
  const last = parsedScripts.get(script);
  if (last?.text === text) return last.locations;
  const locations = parsedText(text);
  parsedScripts.set(script, { text, locations });
  return locations;
}

function parsedText(text: string): readonly Location[] {
  const parsed = jsonIn(text, "its JSON script");
  if (!Array.isArray(parsed))
    throw elementMisuse("its JSON script must hold an array of locations");
  return parsed;
}
