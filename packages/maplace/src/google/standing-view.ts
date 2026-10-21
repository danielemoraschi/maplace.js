/// <reference types="google.maps" preserve="true" />
import type { StandingView } from "../adapter-kit/view-follower";
import type { ResolvedView } from "../viewport";

/** What a user moves a map with: a drag or a button, the wheel, the keyboard. */
const USER_INPUT = ["pointerdown", "wheel", "keydown"] as const;

/**
 * Tells the user's moves from everything else: a move counts as the user's only after their
 * input on the map (or a drag), until the store shows a view. Google moves the camera without
 * input too, and late: measured on Maps JS 3.66, a fit sent before Google has initialised the map
 * is applied some frames after the call (about 24 ms here, longer on CI), so no time window can
 * tell it from a user's move. A view shown after the user's input stands (a click on a marker
 * selects it); a page's own code moving its map isn't the user's move either.
 */
export function createStandingView(map: google.maps.Map): StandingView {
  let view: ResolvedView | undefined;
  let userActed = false;
  const standDown = () => {
    view = undefined;
  };
  const moved = () => {
    if (userActed) standDown();
  };
  const acted = () => {
    userActed = true;
  };
  const element = map.getDiv();
  const listeners = [
    map.addListener("center_changed", moved),
    map.addListener("zoom_changed", moved),
    map.addListener("dragstart", standDown),
  ];
  for (const input of USER_INPUT)
    element.addEventListener(input, acted, { capture: true, passive: true });

  return {
    shown(next) {
      view = next;
      userActed = false;
    },
    standing: () => view,
    stop() {
      for (const listener of listeners) listener.remove();
      for (const input of USER_INPUT) element.removeEventListener(input, acted, true);
    },
  };
}
