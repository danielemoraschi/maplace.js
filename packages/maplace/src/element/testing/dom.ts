import type { MaplaceError } from "../../index";

/** A `<div>` with these attributes, standing for the element that reads them. */
export function elementWith(attributes: Record<string, string>): HTMLElement {
  const element = document.createElement("div");
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  return element;
}

/** The errors `map` dispatches as `maplace-error`, from now on. */
export function errorsOn(map: HTMLElement): MaplaceError[] {
  const errors: MaplaceError[] = [];
  map.addEventListener("maplace-error", (event) => {
    errors.push((event as CustomEvent<{ error: MaplaceError }>).detail.error);
  });
  return errors;
}
