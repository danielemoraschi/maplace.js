/// <reference types="google.maps" />
import type { ResolvedView } from "../viewport";
import { frames } from "./frames";

/** The view the map was last moved to, while nothing else has moved it. */
export interface StandingView {
  /** The camera is being moved to `view`: it stands through that move. */
  shown(view: ResolvedView): void;
  /** Undefined once the user moved the map: a resize then keeps what they chose. */
  standing(): ResolvedView | undefined;
  stop(): void;
}

/** What a user moves a map with: a drag or a button, the wheel, the keyboard. */
const USER_INPUT = ["pointerdown", "wheel", "keydown"] as const;

/**
 * Tells the store's moves from everyone else's on `map`. A move of the centre or zoom outside one
 * of maplace's is the user's (a drag, the wheel, the keyboard, the zoom buttons) or a popup's
 * autopan after it, which chose that view too; a resize changes only the bounds. Measured on
 * Maps JS 3.66: a move ends at its `idle`, except one to where the camera is, which fires
 * nothing at all, so a move that changed nothing in two frames has ended. A move can take half a
 * second to settle (tiles): a change after the user's input on the map (pointer, wheel, keys)
 * is theirs even then, unless maplace moved after that input, as a click on a marker selects.
 */
export function createStandingView(map: google.maps.Map): StandingView {
  let view: ResolvedView | undefined;
  /** One of maplace's moves in progress, and whether the camera has changed during it. */
  let move: { changed: boolean } | undefined;
  let userActed = false;
  const standDown = () => {
    view = undefined;
    move = undefined;
  };
  const changed = () => {
    if (move) move.changed = true;
  };
  const moved = () => (move && !userActed ? changed() : standDown());
  const acted = () => {
    userActed = true;
  };
  const element = map.getDiv();
  const listeners = [
    map.addListener("center_changed", moved),
    map.addListener("zoom_changed", moved),
    map.addListener("bounds_changed", changed),
    map.addListener("dragstart", standDown),
    map.addListener("idle", () => (move = undefined)),
  ];
  for (const input of USER_INPUT)
    element.addEventListener(input, acted, { capture: true, passive: true });

  return {
    shown(next) {
      view = next;
      userActed = false;
      const current = { changed: false };
      move = current;
      void frames(2).then(() => {
        if (move === current && !current.changed) move = undefined;
      });
    },
    standing: () => view,
    stop() {
      for (const listener of listeners) listener.remove();
      for (const input of USER_INPUT) element.removeEventListener(input, acted, true);
    },
  };
}
