import { CONTROL_CLASS } from "../control-styles";

/** The panel holding `node` on the map. */
export function panelOf(node: Element): HTMLElement {
  const panel = node.closest<HTMLElement>(`.${CONTROL_CLASS}`);
  if (panel === null) throw new Error("no panel around the node");
  return panel;
}

/** The first element inside `root` matching `selector`, failing when there is none. */
export function queried(root: Element, selector: string): HTMLElement {
  const found = root.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`nothing matches ${selector}`);
  return found;
}
