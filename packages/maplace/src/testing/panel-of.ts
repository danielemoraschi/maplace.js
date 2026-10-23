import { CONTROL_CLASS } from "../adapter-kit/control-styles";

/** The panel holding `node` on a map, whichever provider draws it. */
export function panelOf(node: Element): HTMLElement {
  const panel = node.closest<HTMLElement>(`.${CONTROL_CLASS}`);
  if (panel === null) throw new Error("no panel around the node");
  return panel;
}
