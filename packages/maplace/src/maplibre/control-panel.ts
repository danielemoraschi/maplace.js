import type { IControl } from "maplibre-gl";
import { adoptStyles } from "../adopted-styles";
import { CONTROL_CLASS, CONTROL_STYLES } from "./control-styles";

/**
 * The control MapLibre lays out for `node`: a panel of maplace's own (`control-styles.ts`) holding
 * the node unchanged, a `.maplibregl-ctrl` so it takes MapLibre's corner layout. Its document gets
 * the panel's styles once it is on the map.
 */
export function panelControl(node: HTMLElement): IControl {
  const panel = panelFor(node);
  return {
    onAdd() {
      adoptStyles(panel.ownerDocument, CONTROL_STYLES);
      return panel;
    },
    onRemove() {
      panel.remove();
    },
  };
}

function panelFor(node: HTMLElement): HTMLElement {
  const panel = node.ownerDocument.createElement("div");
  panel.className = `maplibregl-ctrl ${CONTROL_CLASS}`;
  panel.append(node);
  return panel;
}
