import type { PopupOptions } from "../popup";
import { type Field, mustBe } from "./fail";
import { type Assert, recordOf } from "./record";
import { members, numberIn, oneOf, optional, POSITIVE } from "./values";

const OPEN_ON = members<NonNullable<PopupOptions["openOn"]>>({ click: true, hover: true });

export const checkPopupOptions: Assert<PopupOptions> = recordOf<PopupOptions>({
  checks: {
    maxWidth: optional(numberIn(POSITIVE)),
    offset: optional(checkOffset),
    openOn: optional(oneOf(OPEN_ON)),
  },
  unknown: "is not a popup option",
});

function checkOffset(value: unknown, field: Field): void {
  const isPair =
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate));
  if (!isPair) mustBe(field, "a pair of numbers [x, y]", value);
}
