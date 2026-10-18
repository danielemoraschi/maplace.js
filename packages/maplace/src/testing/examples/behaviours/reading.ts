import type { ResolvedView } from "../../../viewport";
import type { FakeAdapter } from "../../fake-adapter";
import type { ExampleRun } from "../example-runs";

/**
 * What an example does beyond drawing its locations, the same for its page, vanilla and React
 * versions: read on the fake map and in the version's own root, never by id. Inputs are clicked,
 * which a DOM listener and React's `onChange` both hear; React renders outside `act`, so what it
 * shows is polled.
 */
export type ExampleBehaviour = (run: ExampleRun) => Promise<void>;

export type BoundsView = Extract<ResolvedView, { readonly kind: "fit-bounds" }>;

export function latitudeSpanOf(view: BoundsView | undefined): number {
  return (view?.bounds.north ?? 0) - (view?.bounds.south ?? 0);
}

/** The text of the first `selector` inside `root`, if both are there. */
export function textIn(root: Element | undefined, selector: string): string | null | undefined {
  return root?.querySelector(selector)?.textContent;
}

/** The list view inside `root`: the block holding its heading and entries, or the entries. */
export function listIn(root: Element): Element | null {
  return root.querySelector(".maplace-list, [role=listbox], select");
}

/** The first `selector` inside `root` whose text is `text`, failing when there is none. */
export function byText(root: Element, selector: string, text: string): HTMLElement {
  const elements = [...root.querySelectorAll<HTMLElement>(selector)];
  const found = elements.find((candidate) => candidate.textContent?.trim() === text);
  if (found === undefined) throw new Error(`no ${selector} "${text}"`);
  return found;
}

/** Clicks the button inside `root` whose text is `text`. */
export function clickButton(root: Element, text: string): void {
  byText(root, "button", text).click();
}

/** Where the version put controls on its map, in order. */
export function controlPositions(adapter: FakeAdapter): readonly string[] {
  return adapter.callsOf("mountControl").map(({ position }) => position);
}
