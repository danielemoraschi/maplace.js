import type { MaplaceMapElement } from "@maplacejs/maplace/element";
import { MaplaceError } from "../../../../packages/maplace/src/index.ts";
import { FIRST_PROVIDER, type Provider } from "../examples/example-providers.ts";
import { type Conversion, convertPasted } from "./builder-convert.ts";
import { previewLocationsOf } from "./builder-popups.ts";
import { type Note, PasteRefused } from "./builder-report.ts";
import { writeSnippet } from "./builder-snippet.ts";
import { chosenProvider } from "./version-switch.ts";

/**
 * Pixels around the preview's locations: clears a pin's height above a point, and the attribution
 * box, up to about 75 tall in the narrowest frame, below one. The default 40 leaves both on them.
 */
export const PREVIEW_FIT_PADDING = 80;

/** A preview map, which may not be defined yet: then it has no `maplace`. */
type PreviewMap = HTMLElement & {
  locations: unknown;
  readonly maplace?: Pick<MaplaceMapElement["maplace"], "fitAll" | "select">;
};

/** The map attributes a preview follows: those it rebuilds its list for. */
const PREVIEW_ATTRIBUTES = ["list", "list-position", "list-heading", "fit-all", "fit-all-label"];

/** How long typing rests before the page reads it, so a live region isn't told every key. */
const SETTLE_MS = 250;

/** A builder element, which the page always has: its absence is the site's bug. */
function required<Element extends HTMLElement>(page: Document, selector: string): Element {
  const found = page.querySelector<Element>(selector);
  if (found === null) throw new Error(`the builder's page has no ${selector}`);
  return found;
}

const elementsOf = (page: Document) => ({
  paste: required<HTMLTextAreaElement>(page, "[data-builder-paste]"),
  status: required(page, "[data-builder-status]"),
  previewNote: required(page, "[data-builder-preview-note]"),
  notes: required(page, "[data-builder-notes]"),
  notesList: required(page, "[data-builder-notes-list]"),
  trustNote: required(page, "[data-builder-trust-note]"),
  textNote: required(page, "[data-builder-text-note]"),
  keyNote: required(page, "[data-builder-key-note]"),
  serveNote: required(page, "[data-builder-serve-note]"),
  code: required(page, "[data-builder-code]"),
  copy: required<HTMLButtonElement>(page, "[data-builder-copy]"),
  copied: required(page, "[data-builder-copied]"),
});

/**
 * Starts the builder: what is pasted is converted here, in the browser, and written to the page
 * as text. Both providers' maps get it, whichever shows, and wait for consent as any map does.
 */
export function startBuilder(page: Document): void {
  const elements = elementsOf(page);
  const { paste, status, code, copy, copied } = elements;
  const toggle = required(page, "[data-provider-choice]");
  const maps = [...page.querySelectorAll<PreviewMap>("[data-builder-preview] maplace-map")];
  const pinOf = (provider: Provider) =>
    required(page, `[data-pinned-script="${provider}"]`).textContent ?? "";
  let conversion: Conversion | undefined;
  let waiting: ReturnType<typeof setTimeout> | undefined;

  const showSnippet = () => {
    const provider = chosenProvider(toggle) ?? FIRST_PROVIDER;
    const written =
      conversion && writeSnippet({ conversion, provider, pinnedScript: pinOf(provider) });
    code.textContent = written?.text ?? "";
    code.hidden = written === undefined;
    const long = code.scrollHeight > code.clientHeight;
    code.toggleAttribute("data-long", long);
    // Keyboard readers can scroll only what can take focus.
    code.tabIndex = long || code.scrollWidth > code.clientWidth ? 0 : -1;
    copy.disabled = written === undefined;
    copied.textContent = "";
    elements.trustNote.hidden = !written?.popupsAsWritten;
    elements.textNote.hidden = !written?.popupsAsText;
    elements.keyNote.hidden = written === undefined || provider !== "google";
    elements.serveNote.hidden = written === undefined || provider !== "maplibre";
  };

  const render = () => {
    waiting = undefined;
    conversion = undefined;
    try {
      if (paste.value.trim() === "") showStatus(status, "Paste something to start.", false);
      else {
        conversion = convertPasted(paste.value);
        const { format, locations } = conversion;
        const count = `${locations.length} location${locations.length === 1 ? "" : "s"}`;
        showStatus(status, `Read as ${format}: ${count}`, false);
      }
    } catch (error) {
      if (!(error instanceof PasteRefused || error instanceof MaplaceError)) throw error;
      showStatus(status, `Can't read this: ${error.message}`, true);
    }
    showPreview(maps, conversion);
    showNotes(elements.notes, elements.notesList, conversion?.notCarried ?? []);
    elements.previewNote.hidden = !hasPopupOrIcon(conversion);
    showSnippet();
  };

  paste.addEventListener("input", () => {
    clearTimeout(waiting);
    waiting = setTimeout(render, SETTLE_MS);
  });
  toggle.addEventListener("change", showSnippet);
  copy.addEventListener("click", () => {
    // A paste still settling is what the reader means to copy.
    if (waiting !== undefined) {
      clearTimeout(waiting);
      render();
    }
    if (copy.disabled) return;
    void copyText(code.textContent ?? "").then((words) => {
      copied.textContent = words;
    });
  });
  render();
  showViewWhenDefined(maps, () => conversion);
}

/** Copies `text`, and what to tell the reader; a page off HTTPS has no clipboard at all. */
async function copyText(text: string): Promise<string> {
  try {
    await navigator.clipboard.writeText(text);
    return "Copied";
  } catch {
    return "Select the code to copy it";
  }
}

function showStatus(status: HTMLElement, words: string, refused: boolean): void {
  status.textContent = words;
  status.toggleAttribute("data-refused", refused);
}

/** Every map shows what the snippet says, or nothing: never what it doesn't. */
function showPreview(maps: readonly PreviewMap[], conversion: Conversion | undefined): void {
  const locations = conversion ? previewLocationsOf(conversion.locations) : [];
  const attributes = new Map(conversion?.attributes);
  for (const map of maps) {
    map.locations = locations;
    for (const name of PREVIEW_ATTRIBUTES) {
      const value = attributes.get(name);
      if (value === undefined) map.removeAttribute(name);
      else map.setAttribute(name, value);
    }
    showView(map, conversion);
  }
}

function selectedIdIn(conversion: Conversion): string | undefined {
  return new Map(conversion.attributes).get("selected-id");
}

/**
 * What the snippet selects, or all the locations if nothing. New locations leave the camera
 * where it is, so a paste would stay on the sample; a map not defined yet has no `maplace`, and
 * `showViewWhenDefined` gives it its first view.
 */
function showView(map: PreviewMap, conversion: Conversion | undefined): void {
  if (map.maplace === undefined || conversion === undefined) return;
  const selectedId = selectedIdIn(conversion);
  map.maplace.select(selectedId);
  if (selectedId === undefined) map.maplace.fitAll({ padding: PREVIEW_FIT_PADDING });
}

/** A map's opening view is the store's own, with the default padding, unless asked for first. */
function showViewWhenDefined(
  maps: readonly PreviewMap[],
  currentConversion: () => Conversion | undefined,
): void {
  void customElements.whenDefined("maplace-map").then(() => {
    for (const map of maps) showView(map, currentConversion());
  });
}

function showNotes(block: HTMLElement, list: HTMLElement, notes: readonly Note[]): void {
  block.hidden = notes.length === 0;
  list.replaceChildren(
    ...notes.map(({ name, says }) => {
      const item = list.ownerDocument.createElement("li");
      const code = list.ownerDocument.createElement("code");
      code.textContent = name;
      item.append(code, ` ${says}`);
      return item;
    }),
  );
}

function hasPopupOrIcon(conversion: Conversion | undefined): boolean {
  return (
    conversion?.locations.some(({ html, icon }) => html !== undefined || icon !== undefined) ??
    false
  );
}
