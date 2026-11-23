import type { MaplaceOptions, PopupOptions } from "../index";
import { OPEN_ON } from "../validate/popup";
import { booleanOrRaw, textOf } from "./attribute-values";
import { elementMisuse } from "./element-error";
import { oneOfAttribute, switchAttribute } from "./element-list";
import { HEATMAP_ATTRIBUTES, heatmapOf } from "./heatmap-attributes";
import type { StandingMisuse } from "./standing-misuse";
import { firstViewOf, VIEW_ATTRIBUTES } from "./view-attributes";

/**
 * What the store's map adds, its words and its first view, as the store's options, a popup's links
 * among them.
 */
export type StoreAttributes = Pick<
  MaplaceOptions,
  "cluster" | "heatmap" | "skipMapLabel" | "selectedLabel" | "popup" | "view"
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
  ...HEATMAP_ATTRIBUTES,
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
    heatmap: valueOrNone(() => heatmapOf(host)),
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
 * A bad value stands as misuse, run as `run` says, as does a change from what a store `taken`:
 * before there is one, the values alone are checked.
 */
export function checkStoreAttributes(
  host: HTMLElement,
  taken: StoreAttributes | undefined,
  run: StandingMisuse["attempt"],
): void {
  run("store", () => {
    checkValues(host);
    if (taken === undefined) return;
    if (JSON.stringify(readStoreAttributes(host)) !== JSON.stringify(taken)) {
      const problem = `${STORE_ATTRIBUTES.join(", ")} can't change once the map is created`;
      throw elementMisuse(problem);
    }
  });
}

/**
 * A blank label, a bad switch, popup opening, heatmap (beside cluster, or a max zoom without it or
 * out of range) or view is misuse: thrown.
 */
function checkValues(host: HTMLElement): void {
  for (const name of LABEL_ATTRIBUTES) textOf(host, name);
  for (const name of SWITCH_ATTRIBUTES) switchAttribute(host, name);
  popupOpeningOf(host);
  heatmapOf(host);
  firstViewOf(host);
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
