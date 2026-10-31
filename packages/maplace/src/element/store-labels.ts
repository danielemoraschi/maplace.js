import type { MaplaceOptions } from "../index";
import { elementMisuse } from "./element-error";
import type { StandingMisuse } from "./standing-misuse";

/** The words of what the store's map adds, as the store's options, a popup's links among them. */
export type StoreLabels = Pick<MaplaceOptions, "skipMapLabel" | "selectedLabel" | "popup">;

export const LABEL_ATTRIBUTES = [
  "skip-map-label",
  "selected-label",
  "open-in-maps-label",
  "directions-label",
] as const;

/** Whether `name` is an attribute the store takes a label from when it is created. */
export function isStoreLabelAttribute(name: string): boolean {
  return (LABEL_ATTRIBUTES as readonly string[]).includes(name);
}

/** The labels as written, a blank one left out. */
export function readStoreLabels(host: HTMLElement): StoreLabels {
  return {
    skipMapLabel: nonBlank(host.getAttribute("skip-map-label")),
    selectedLabel: nonBlank(host.getAttribute("selected-label")),
    popup: {
      openInMapsLabel: nonBlank(host.getAttribute("open-in-maps-label")),
      directionsLabel: nonBlank(host.getAttribute("directions-label")),
    },
  };
}

/** A blank label stands as misuse, as does a change from what the store `taken`. */
export function checkStoreLabels(
  host: HTMLElement,
  taken: StoreLabels,
  misuse: StandingMisuse,
): void {
  const blank = LABEL_ATTRIBUTES.find((name) => host.getAttribute(name)?.trim() === "");
  if (blank !== undefined) {
    misuse.fail("labels", elementMisuse(`${blank} must not be blank`, { field: blank }));
  } else if (JSON.stringify(readStoreLabels(host)) === JSON.stringify(taken)) {
    misuse.clear("labels");
  } else {
    const problem = `${LABEL_ATTRIBUTES.join(", ")} can't change once the map is created`;
    misuse.fail("labels", elementMisuse(problem));
  }
}

export function nonBlank(text: string | null): string | undefined {
  return text?.trim() ? text : undefined;
}
