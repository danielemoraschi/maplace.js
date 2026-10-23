import { MAPS_SCRIPT_ORIGIN } from "../maps-script-url";

/** Every Maps JS tag on the page, in order, whoever added it. */
export function mapsTags(): HTMLScriptElement[] {
  return [...document.querySelectorAll<HTMLScriptElement>(`script[src^="${MAPS_SCRIPT_ORIGIN}"]`)];
}
