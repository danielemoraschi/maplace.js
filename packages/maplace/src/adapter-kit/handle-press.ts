/** A press that holds a shape's handles until the pointer moves after it. */
export interface HandlePress {
  /** A press is on, or over with the pointer not yet moved since. */
  isHeld(): boolean;
  /** A press began: held from now, if it is the main button's or a finger's. */
  start(event: PointerEvent): void;
  /** Lets go of a press at once, unheard: the shape's editing stopped. */
  stop(): void;
}

/**
 * A press that keeps a shape's handles while it lasts and until the pointer next moves
 * or presses after it (`over` then runs): the shape's hover may leave mid-drag (the pointer
 * outrunning a handle, crossing a marker, or let go outside the map), and the release may come in
 * another app after a blur. It ends once that move or press has been handled, a task later: the
 * provider has heard the release (Google hears it after the window) and the move, so the pointer's
 * hover is where it is, and a new press on the handles has started its own hold. A finger hovers
 * nothing and sends no move between taps, so its press ends a frame after it lets go.
 */
export function handlePress(element: Element, over: () => void): HandlePress {
  // A map's element is in a document with a window.
  const view = element.ownerDocument.defaultView as Window;
  let pressed: AbortController | undefined;
  const stop = () => {
    pressed?.abort();
    pressed = undefined;
  };
  return {
    isHeld: () => pressed !== undefined,
    start(event) {
      if (!isMainPress(event)) return;
      stop();
      const press = new AbortController();
      pressed = press;
      // Heard first, as the window captures it: a handler that stops it can't keep the press held.
      const once = { capture: true, once: true, signal: press.signal };
      const settle = () => {
        if (press.signal.aborted) return;
        stop();
        over();
      };
      const settleLater = () => setTimeout(settle);
      const pressEnded = () => {
        if (event.pointerType === "touch") {
          requestAnimationFrame(settle);
          return;
        }
        for (const type of ["pointermove", "pointerdown"]) {
          view.addEventListener(type, settleLater, once);
        }
      };
      view.addEventListener("pointerup", pressEnded, once);
      view.addEventListener("pointercancel", pressEnded, once);
      // Not captured: the window would hear every element's blur as well as its own.
      view.addEventListener("blur", pressEnded, { once: true, signal: press.signal });
    },
    stop,
  };
}

/**
 * A press with the main button, or a finger: another button's release may go to a menu the page
 * never sees, so its press can't be held.
 */
export function isMainPress(event: PointerEvent): boolean {
  return !event.button;
}
