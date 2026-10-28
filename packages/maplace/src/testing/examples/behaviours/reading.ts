import type { ResolvedView } from "../../../viewport";
import type { FakeAdapter } from "../../fake-adapter";
import { MAPLACE_LIST_CONTROL } from "../example-layout";
import type { ExampleRun } from "../example-runs";

/**
 * What an example does beyond drawing its locations, the same for its page, vanilla and React
 * versions: read on the fake map and in the version's own root, never by id. Inputs are clicked,
 * or a select changed with a bubbling `change`, which a DOM listener and React's `onChange` both
 * hear; React renders outside `act`, so what it shows is polled.
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
  return root.querySelector(`.maplace-list, ${MAPLACE_LIST_CONTROL}`);
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

/** Chooses `option` in the select inside `root` labelled `label`, as a reader would. */
export function chooseOption(root: Element, label: string, option: string): void {
  const select = selectLabelled(root, label);
  const chosen = [...select.options].find((candidate) => candidate.text.trim() === option);
  if (chosen === undefined) throw new Error(`no option "${option}" in ${label}`);
  select.value = chosen.value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

/** The text of the option chosen in the select inside `root` labelled `label`. */
export function chosenOption(root: Element, label: string): string | undefined {
  return selectLabelled(root, label).selectedOptions[0]?.text.trim();
}

/** The options of the select inside `root` labelled `label`, as a reader reads them. */
export function optionsOf(root: Element, label: string): string[] {
  return [...selectLabelled(root, label).options].map((option) => option.text.trim());
}

/** The select inside `root` its `<label>` names `label`, failing when there is none. */
function selectLabelled(root: Element, label: string): HTMLSelectElement {
  const select = (byText(root, "label", label) as HTMLLabelElement).control;
  if (!(select instanceof HTMLSelectElement)) throw new Error(`no select labelled "${label}"`);
  return select;
}

/** Where the version put controls on its map, in order. */
export function controlPositions(adapter: FakeAdapter): readonly string[] {
  return adapter.callsOf("mountControl").map(({ position }) => position);
}
