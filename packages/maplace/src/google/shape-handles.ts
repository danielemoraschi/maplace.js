import { handlePress } from "../adapter-kit/handle-press";
import type { MountedMap } from "./mounted-map";
import type { GoogleShape } from "./placed-location";

/** A Google shape's handles, by its `editable` option. */
export interface ShapeHandles {
  /** Shows or hides the handles as `wanted` says now. */
  sync(): void;
  /** Whether the handles are on, as this last set them. */
  shown(): boolean;
  /** Stops hearing presses, for a shape taken off. */
  stop(): void;
}

/**
 * The handles of an editable shape, on while `wanted` says so for whether a press on the map is
 * held (`showsEditHandles`). A press that finds them on keeps them as `handlePress` holds it: the
 * hover may leave mid-drag, and Google drops a drag whose shape stops being editable (M27),
 * hearing the release after the window does. Google tells no press on a handle from one elsewhere
 * on the map, so any press holds them. Only a shape with its handles on hears presses, and a press
 * never turns them on, so a touch on a shape at rest doesn't flash them.
 *
 * A blur's cut (`takeEditingAway`) turns `editable` off without this, on purpose, and gives it
 * back by `shown`; a sync compares with what this last set, so it never undoes a cut.
 */
export function shapeHandles(
  shape: GoogleShape,
  wanted: (held: boolean) => boolean,
  mounted: MountedMap,
): ShapeHandles {
  const element = mounted.map.getDiv();
  const press = handlePress(element, () => sync());
  let shown = false;
  let hearing: AbortController | undefined;

  function sync(): void {
    const on = wanted(press.isHeld());
    if (on === shown) return;
    shown = on;
    shape.setValues({ editable: on });
    hearing?.abort();
    hearing = on ? hearPresses() : undefined;
  }

  /** Presses on the map, heard while the handles are on. */
  function hearPresses(): AbortController {
    const listening = new AbortController();
    element.addEventListener("pointerdown", press.start, {
      capture: true,
      signal: listening.signal,
    });
    return listening;
  }

  sync();
  return {
    sync,
    shown: () => shown,
    stop() {
      hearing?.abort();
      press.stop();
    },
  };
}
