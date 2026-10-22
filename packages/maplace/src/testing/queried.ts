/** The first element inside `root` matching `selector`, failing when there is none. */
export function queried(root: Element, selector: string): HTMLElement {
  const found = root.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`nothing matches ${selector}`);
  return found;
}
