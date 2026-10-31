import type { MaplaceOptions } from "../index";
import { elementMisuse } from "./element-error";
import type { StandingMisuse } from "./standing-misuse";

/** The words of what `attach` adds to a map, as the store's options. */
export type StoreLabels = Pick<MaplaceOptions, "skipMapLabel" | "selectedLabel">;

export const LABEL_ATTRIBUTES = ["skip-map-label", "selected-label"] as const;

/** Whether `name` is an attribute the store takes a label from when it is created. */
export function isStoreLabelAttribute(name: string): boolean {
  return (LABEL_ATTRIBUTES as readonly string[]).includes(name);
}

/** The labels as written, a blank one left out. */
export function readStoreLabels(host: HTMLElement): StoreLabels {
  return {
    skipMapLabel: nonBlank(host.getAttribute("skip-map-label")),
    selectedLabel: nonBlank(host.getAttribute("selected-label")),
  };
}

/** A blank label stands as misuse, as does a change from what the store `taken`. */
export function checkStoreLabels(
  host: HTMLElement,
  taken: StoreLabels,
  misuse: StandingMisuse,
): void {
  const blank = LABEL_ATTRIBUTES.find((name) => host.getAttribute(name)?.trim() === "");
  const { skipMapLabel, selectedLabel } = readStoreLabels(host);
  if (blank !== undefined) {
    misuse.fail("labels", elementMisuse(`${blank} must not be blank`, { field: blank }));
  } else if (skipMapLabel !== taken.skipMapLabel || selectedLabel !== taken.selectedLabel) {
    const problem = "skip-map-label and selected-label can't change once the map is created";
    misuse.fail("labels", elementMisuse(problem));
  } else misuse.clear("labels");
}

function nonBlank(text: string | null): string | undefined {
  return text?.trim() ? text : undefined;
}
