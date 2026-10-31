import { element } from "./listbox-nodes";

export const SEARCH_CLASS = "maplace-search";
export const SEARCH_STATUS_CLASS = "maplace-search-status";
/**
 * How long typing must pause before it narrows: a map redraws for each change of what it shows,
 * MapLibre for many frames, and those frames would run under the next keys.
 */
export const SEARCH_PAUSE_MS = 150;

/** What a list with `searchLabel` shows above its entries: the box's name, and its status's words. */
export interface SearchBoxLabels {
  readonly label: string;
  readonly noMatches: string;
  readonly matches: string;
}

/** How many a query found, 0 when nothing matches anywhere; undefined says nothing. */
export type SearchFound = number | undefined;

/** The box a list is narrowed from. */
export interface SearchBox {
  /** Calls `search` with what is typed, once typing pauses; returns what stops it. */
  onSearch(search: (text: string) => void): () => void;
  /** Shows the store's query, leaving what is typed or waits to report, and says what it found. */
  show(query: string | undefined, found: SearchFound): void;
}

/** A search box, its input, and the status it speaks in. */
export interface SearchBoxParts extends SearchBox {
  readonly input: HTMLInputElement;
  readonly status: HTMLElement;
  /** Puts focus on the input. */
  focus(): void;
}

/** The scripts an input method composes before they are the words: kana before kanji, say. */
const CONVERTED_LATER =
  /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}\p{Script=Hangul}\p{Script=Bopomofo}]/u;

/**
 * A search input, Enter doing nothing so a page's form around the list isn't submitted, and its
 * status, always on the page and empty with no query, so a screen reader hears its text arrive.
 * Other composing text reports as it goes, as Android's keyboards compose every word.
 */
export function createSearchBox(labels: SearchBoxLabels): SearchBoxParts {
  const input = element("input", SEARCH_CLASS) as HTMLInputElement;
  input.type = "search";
  input.autocomplete = "off";
  input.placeholder = labels.label;
  input.setAttribute("aria-label", labels.label);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") event.preventDefault();
  });
  let composing = false;
  let pause: ReturnType<typeof setTimeout> | undefined;
  const endPause = () => {
    clearTimeout(pause);
    pause = undefined;
  };
  input.addEventListener("compositionstart", () => {
    composing = true;
  });
  input.addEventListener("compositionend", () => {
    composing = false;
  });
  const status = element("div", SEARCH_STATUS_CLASS);
  status.setAttribute("role", "status");
  return {
    input,
    status,
    onSearch(search) {
      const listening = new AbortController();
      const { signal } = listening;
      const report = () => {
        endPause();
        search(input.value);
      };
      const reportAfterPause = () => {
        endPause();
        if (!(composing && CONVERTED_LATER.test(input.value))) {
          pause = setTimeout(report, SEARCH_PAUSE_MS);
        }
      };
      input.addEventListener("input", reportAfterPause, { signal });
      input.addEventListener("compositionend", report, { signal });
      return () => {
        listening.abort();
        endPause();
      };
    },
    show(query, found) {
      const shown = query ?? "";
      if (!composing && pause === undefined && input.value.trim() !== shown) input.value = shown;
      const said = saidFor(found, labels);
      if (status.textContent !== said) status.textContent = said;
    },
    focus() {
      input.focus({ preventScroll: true });
    },
  };
}

function saidFor(found: SearchFound, { noMatches, matches }: SearchBoxLabels): string {
  if (found === undefined) return "";
  return found === 0 ? noMatches : `${matches}: ${found}`;
}
