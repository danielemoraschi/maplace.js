/// <reference types="google.maps" preserve="true" />
import type { Adapter, ControlPosition } from "../adapter";
import { googlePosition } from "./control-positions";
import type { MapPart, MountedMap } from "./mounted-map";

/** The adapter's controls: a part on the open map, `mountControl`, and `release` on destroy. */
export interface Controls extends Pick<Adapter, "mountControl"> {
  readonly part: MapPart;
  /**
   * The adapter is destroyed, its map opened or not: later controls leave the page's node where it
   * is, as nothing will show them. Closing the map took the others off.
   */
  release(): void;
}

/** A page's node on the map: the element Google holds it in, and its corner. */
interface MountedControl {
  readonly holder: HTMLElement;
  readonly position: ControlPosition;
}

/**
 * `Adapter.mountControl` on Google. Google writes its layout on what it is given (inline
 * `position`, `left`, `top`, and leaves some behind when it lets go, on Maps JS 3.66), so it is
 * given an element of maplace's own holding the page's node, never the node. Taking every control
 * off as the map closes matters for the page's own map, which stays on the page. Google keeps a
 * control's keys, wheel and drags from the map by itself (measured on 3.66), so nothing here does.
 */
export function createControls(): Controls {
  const byNode = new Map<HTMLElement, MountedControl>();
  let openMap: MountedMap | undefined;
  let destroyed = false;

  function corner(
    { position }: MountedControl,
    on = openMap,
  ): google.maps.MVCArray<HTMLElement> | undefined {
    return on?.map.controls[googlePosition(on.libraries.core, position)];
  }

  function place(control: MountedControl): void {
    corner(control)?.push(control.holder);
  }

  function takeOff(control: MountedControl, from = openMap): void {
    const held = corner(control, from);
    if (held === undefined) return;
    const index = held.getArray().indexOf(control.holder);
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
      const control = { holder: holderOf(node), position };
      byNode.set(node, control);
      place(control);
      return () => remove(node, control);
    },
  };
}

/** A new element of maplace's own holding `node`, which Google may lay out as it likes. */
function holderOf(node: HTMLElement): HTMLElement {
  const holder = node.ownerDocument.createElement("div");
  holder.append(node);
  return holder;
}
