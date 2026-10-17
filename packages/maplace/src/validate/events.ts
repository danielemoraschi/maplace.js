import { type ListenOptions, MAPLACE_EVENT_NAME_LIST } from "../events";
import { type Field, mustBe } from "./fail";
import { type Assert, recordOf } from "./record";
import { oneOf, optional } from "./values";

export const checkEventName = oneOf(MAPLACE_EVENT_NAME_LIST);

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
