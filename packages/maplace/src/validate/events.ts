import type { ListenOptions, MaplaceEventName } from "../events";
import { type Field, mustBe } from "./fail";
import { type Assert, recordOf } from "./record";
import { members, oneOf, optional } from "./values";

const EVENT_NAMES = members<MaplaceEventName>({
  select: true,
  hover: true,
  change: true,
  popupOpen: true,
  popupClose: true,
  viewport: true,
  route: true,
  error: true,
});

export const checkEventName = oneOf(EVENT_NAMES);

export const checkListenOptions: Assert<ListenOptions> = recordOf<ListenOptions>({
  checks: { signal: optional(checkSignal) },
  unknown: "is not a listen option",
});

// Duck-typed rather than `instanceof AbortSignal`, so signals from another realm (an iframe) pass.
function checkSignal(value: unknown, field: Field): void {
  const isSignal =
    typeof value === "object" &&
    value !== null &&
    "aborted" in value &&
    "addEventListener" in value;
  if (!isSignal) mustBe(field, "an AbortSignal", value);
}
