import { UNSTYLED_ATTRIBUTE } from "../unstyled";

/**
 * Marks the page with the opt-out from maplace's default styles; gives back what takes it off
 * again, for the test to call, or to hand to `onTestFinished`.
 */
export function unstyledPage(): () => void {
  document.body.setAttribute(UNSTYLED_ATTRIBUTE, "");
  return () => document.body.removeAttribute(UNSTYLED_ATTRIBUTE);
}
