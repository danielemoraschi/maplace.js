import type { MaplaceOptions, PopupOptions } from "../index";
import { OPEN_ON } from "../validate/popup";
import { booleanOrRaw } from "./attribute-values";
import { elementMisuse } from "./element-error";
import { oneOfAttribute, switchAttribute } from "./element-list";
import type { StandingMisuse } from "./standing-misuse";
import { firstViewOf, VIEW_ATTRIBUTES } from "./view-attributes";

/**
 * What the store's map adds, its words and its first view, as the store's options, a popup's links
 * among them.
 */
export type StoreAttributes = Pick<
  MaplaceOptions,
  "cluster" | "skipMapLabel" | "selectedLabel" | "popup" | "view"
>;

const LABEL_ATTRIBUTES = [
  "skip-map-label",
  "selected-label",
  "open-in-maps-label",
  "directions-label",
] as const;

/** The links at the end of a popup, which a hover popup can't hold. */
const LINK_ATTRIBUTES = ["open-in-maps-link", "directions-link"] as const;

const SWITCH_ATTRIBUTES = [...LINK_ATTRIBUTES, "cluster"] as const;

/** Every attribute the store takes something from when it is created. */
export const STORE_ATTRIBUTES: readonly string[] = [
  ...LABEL_ATTRIBUTES,
  ...SWITCH_ATTRIBUTES,
  "popup-open-on",
  ...VIEW_ATTRIBUTES,
];

export function isStoreAttribute(name: string): boolean {
  return STORE_ATTRIBUTES.includes(name);
}

/**
 * The attributes as written, a blank label, a bad view or popup opening left out and a bad switch
 * off: misuse says them later.
 */
export function readStoreAttributes(host: HTMLElement): StoreAttributes {
  return {
    cluster: booleanOrRaw(host, "cluster") === true,
    skipMapLabel: nonBlank(host.getAttribute("skip-map-label")),
    selectedLabel: nonBlank(host.getAttribute("selected-label")),
    popup: {
      openOn: valueOrNone(() => popupOpeningOf(host)),
      openInMapsLink: booleanOrRaw(host, "open-in-maps-link") === true,
      openInMapsLabel: nonBlank(host.getAttribute("open-in-maps-label")),
      directionsLink: booleanOrRaw(host, "directions-link") === true,
      directionsLabel: nonBlank(host.getAttribute("directions-label")),
    },
    view: valueOrNone(() => firstViewOf(host)),
  };
}

/**
 * A blank label, a bad switch, popup opening or view stands as misuse, as does a change from what
 * the store `taken`.
 */
export function checkStoreAttributes(
  host: HTMLElement,
  taken: StoreAttributes,
  misuse: StandingMisuse,
): void {
  misuse.attempt("store", () => {
    const blank = LABEL_ATTRIBUTES.find((name) => host.getAttribute(name)?.trim() === "");
    if (blank !== undefined) throw elementMisuse(`${blank} must not be blank`, { field: blank });
    for (const name of SWITCH_ATTRIBUTES) switchAttribute(host, name);
    popupOpeningOf(host);
    firstViewOf(host);
    if (JSON.stringify(readStoreAttributes(host)) !== JSON.stringify(taken)) {
      const problem = `${STORE_ATTRIBUTES.join(", ")} can't change once the map is created`;
      throw elementMisuse(problem);
    }
  });
}

/**
 * `popup-open-on`, one of the store's `popup.openOn` values; `hover` beside a link is misuse, as
 * the store refuses it.
 */
function popupOpeningOf(host: HTMLElement): PopupOptions["openOn"] {
  const opening = oneOfAttribute(host, "popup-open-on", OPEN_ON);
  const linked = LINK_ATTRIBUTES.some((name) => booleanOrRaw(host, name) === true);
  if (opening === "hover" && linked) {
    const problem = 'popup-open-on "hover" cannot be set together with a link in the popup';
    throw elementMisuse(problem, { field: "popup-open-on" });
  }
  return opening;
}

/** An attribute's value, or none while it is misuse: `read` throws only that. */
function valueOrNone<Value>(read: () => Value): Value | undefined {
  try {
    return read();
  } catch {
    return undefined;
  }
}

export function nonBlank(text: string | null): string | undefined {
  return text?.trim() ? text : undefined;
}
