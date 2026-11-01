import type { MaplaceOptions } from "../index";
import { booleanOrRaw } from "./attribute-values";
import { elementMisuse } from "./element-error";
import { switchAttribute } from "./element-list";
import type { StandingMisuse } from "./standing-misuse";

/** What the store's map adds and its words, as the store's options, a popup's links among them. */
export type StoreLabels = Pick<MaplaceOptions, "skipMapLabel" | "selectedLabel" | "popup">;

const LABEL_ATTRIBUTES = [
  "skip-map-label",
  "selected-label",
  "open-in-maps-label",
  "directions-label",
] as const;

/** Every attribute the store takes something from when it is created. */
export const STORE_ATTRIBUTES: readonly string[] = [
  ...LABEL_ATTRIBUTES,
  "open-in-maps-link",
  "directions-link",
];

export function isStoreAttribute(name: string): boolean {
  return STORE_ATTRIBUTES.includes(name);
}

/** The attributes as written, a blank label left out and a bad switch off: misuse says them later. */
export function readStoreLabels(host: HTMLElement): StoreLabels {
  return {
    skipMapLabel: nonBlank(host.getAttribute("skip-map-label")),
    selectedLabel: nonBlank(host.getAttribute("selected-label")),
    popup: {
      openInMapsLink: booleanOrRaw(host, "open-in-maps-link") === true,
      openInMapsLabel: nonBlank(host.getAttribute("open-in-maps-label")),
      directionsLink: booleanOrRaw(host, "directions-link") === true,
      directionsLabel: nonBlank(host.getAttribute("directions-label")),
    },
  };
}

/** A blank label or a bad switch stands as misuse, as does a change from what the store `taken`. */
export function checkStoreLabels(
  host: HTMLElement,
  taken: StoreLabels,
  misuse: StandingMisuse,
): void {
  misuse.attempt("labels", () => {
    const blank = LABEL_ATTRIBUTES.find((name) => host.getAttribute(name)?.trim() === "");
    if (blank !== undefined) throw elementMisuse(`${blank} must not be blank`, { field: blank });
    // Read for its refusal: `readStoreLabels` has them off.
    switchAttribute(host, "open-in-maps-link");
    switchAttribute(host, "directions-link");
    if (JSON.stringify(readStoreLabels(host)) !== JSON.stringify(taken)) {
      const problem = `${STORE_ATTRIBUTES.join(", ")} can't change once the map is created`;
      throw elementMisuse(problem);
    }
  });
}

export function nonBlank(text: string | null): string | undefined {
  return text?.trim() ? text : undefined;
}
