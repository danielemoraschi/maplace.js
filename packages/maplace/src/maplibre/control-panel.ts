import type { IControl } from "maplibre-gl";
import { CONTROL_CLASS } from "../adapter-kit/control-styles";
import { adoptStyles } from "../adopted-styles";
import { CONTROL_STYLES } from "./control-styles";

/**
 * The control MapLibre lays out for `node`: a panel of maplace's own (`control-styles.ts`) holding
 * the node unchanged, a `.maplibregl-ctrl` so it takes MapLibre's corner layout. The map's document
 * gets the panel's styles once it is on the map, whichever document the page made the node in.
 */
export function panelControl(node: HTMLElement): IControl {
  const panel = panelFor(node);
  return {
    onAdd(map) {
      adoptStyles(map.getContainer().ownerDocument, CONTROL_STYLES);
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
