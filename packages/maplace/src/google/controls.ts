/// <reference types="google.maps" preserve="true" />
import type { Adapter, ControlPosition } from "../adapter";
import { adoptStyles } from "../adopted-styles";
import { googlePosition } from "./control-positions";
import { CONTROL_CLASS, CONTROL_STYLES } from "./control-styles";
import type { MapPart, MountedMap } from "./mounted-map";
import type { ColorScheme } from "./options";

/** The adapter's controls: a part on the open map, `mountControl`, and `release` on destroy. */
export interface Controls extends Pick<Adapter, "mountControl"> {
  readonly part: MapPart;
  /**
   * The adapter is destroyed, its map opened or not: later controls leave the page's node where it
   * is, as nothing will show them. Closing the map took the others off.
   */
  release(): void;
}

/** A page's node on the map: the panel Google holds it in, and its corner. */
interface MountedControl {
  readonly panel: HTMLElement;
  readonly position: ControlPosition;
}

/**
 * `Adapter.mountControl` on Google. Google writes its layout on what it is given (inline
 * `position`, `left`, `top`, and leaves some behind when it lets go, on Maps JS 3.66), so it is
 * given an element of maplace's own holding the page's node, never the node: the control's panel
 * (`control-styles.ts`), in the map's colour scheme. Taking every control off as the map closes
 * matters for the page's own map, which stays on the page. Google keeps a control's keys, wheel
 * and drags from the map by itself (measured on 3.66), so nothing here does.
 */
export function createControls(colorScheme: ColorScheme = "light"): Controls {
  const byNode = new Map<HTMLElement, MountedControl>();
  let openMap: MountedMap | undefined;
  let destroyed = false;

  function corner(
    { position }: MountedControl,
    on = openMap,
  ): google.maps.MVCArray<HTMLElement> | undefined {
    return on?.map.controls[googlePosition(on.libraries.core, position)];
  }

  /** Places `control`, its panel styled by the map's document, whichever made the node. */
  function place(control: MountedControl): void {
    const held = corner(control);
    if (openMap === undefined || held === undefined) return;
    adoptStyles(openMap.map.getDiv().ownerDocument, CONTROL_STYLES);
    held.push(control.panel);
  }

  function takeOff(control: MountedControl, from = openMap): void {
    const held = corner(control, from);
    if (held === undefined) return;
    const index = held.getArray().indexOf(control.panel);
    if (index >= 0) held.removeAt(index);
  }

  /** Takes `node`'s control off and out of the page, unless the node was mounted again since. */
  function remove(node: HTMLElement, control: MountedControl): void {
    if (byNode.get(node) !== control) return;
    byNode.delete(node);
    takeOff(control);
    node.remove();
  }

  return {
    part: {
      open(mounted) {
        openMap = mounted;
        for (const control of byNode.values()) place(control);
        mounted.onDestroy(() => {
          openMap = undefined;
          for (const control of byNode.values()) takeOff(control, mounted);
        });
      },
    },
    release() {
      destroyed = true;
    },
    mountControl(node, position) {
      if (destroyed) return () => {};
      const previous = byNode.get(node);
      if (previous) takeOff(previous);
      const control = { panel: panelFor(node, colorScheme), position };
      byNode.set(node, control);
      place(control);
      return () => remove(node, control);
    },
  };
}

/** The panel Google lays out as it likes: an element of maplace's own holding `node` unchanged. */
function panelFor(node: HTMLElement, colorScheme: ColorScheme): HTMLElement {
  const panel = node.ownerDocument.createElement("div");
  panel.className = CONTROL_CLASS;
  panel.dataset.colorScheme = colorScheme;
  panel.append(node);
  return panel;
}
