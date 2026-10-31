import type { PopupOptions } from "../popup";
import { child, type Field, mustBe, reject } from "./fail";
import { type Assert, recordOf } from "./record";
import { checkNonBlankString, members, numberIn, oneOf, optional, POSITIVE } from "./values";

const OPEN_ON = members<NonNullable<PopupOptions["openOn"]>>({ click: true, hover: true });

const checkPopupFields: Assert<PopupOptions> = recordOf<PopupOptions>({
  checks: {
    maxWidth: optional(numberIn(POSITIVE)),
    offset: optional(checkOffset),
    openOn: optional(oneOf(OPEN_ON)),
    openInMapsLabel: optional(checkNonBlankString),
    directionsLabel: optional(checkNonBlankString),
  },
  unknown: "is not a popup option",
});

export const checkPopupOptions: Assert<PopupOptions> = (value, field) => {
  checkPopupFields(value, field);
  if (value.openOn === "hover" && (value.openInMapsLabel ?? value.directionsLabel) !== undefined) {
    reject(
      child(field, "openOn"),
      "can't be 'hover' with a link in the popup: a pointer can't reach it",
    );
  }
};

function checkOffset(value: unknown, field: Field): void {
  const isPair =
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate));
  if (!isPair) mustBe(field, "a pair of numbers [x, y]", value);
}
