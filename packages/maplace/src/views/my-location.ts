import { carryStyles } from "../adopted-styles";
import type { LatLng } from "../geometry";
import { runSafely } from "../state/safely";
import type { Maplace } from "../store";
import { child, root } from "../validate/fail";
import { type Assert, recordOf } from "../validate/record";
import { checkNonBlankString, optional } from "../validate/values";
import { LIST_STYLES } from "./list-styles";
import { myLocationNodes } from "./my-location-nodes";

export interface MyLocationOptions {
  /** The button's words. Default "My location". */
  readonly label?: string | undefined;
  /** What it says when no position comes. Default "Location unavailable". */
  readonly unavailableLabel?: string | undefined;
}

/** A view of its own: its `element` goes on the map with `mountControl`, or anywhere in the page. */
export interface MyLocationControl {
  readonly element: HTMLElement;
  destroy(): void;
}

const checkOptions: Assert<MyLocationOptions> = recordOf<MyLocationOptions>({
  checks: {
    label: optional(checkNonBlankString),
    unavailableLabel: optional(checkNonBlankString),
  },
  unknown: "is not an option",
});

/**
 * The origins a control set, each the store's own frozen point: what shows a button pressed, through
 * a map opened again or a control built anew, while an origin from the page never does.
 */
const fromBrowser = new WeakSet<LatLng>();

/** How long the browser has for a reading, once the visitor has allowed it. */
const READING_TIMEOUT_MS = 10_000;

/**
 * A button that asks the browser for the visitor's position, only when pressed, and makes it the
 * store's origin, the map centred there at its zoom; pressed again, it clears it. Refused,
 * unavailable, timed out or not on HTTPS, its status says so and the origin stands. A press while
 * asking asks again, as a browser may never answer a dismissed prompt.
 */
export function createMyLocationControl<Data>(
  maplace: Maplace<Data>,
  options?: MyLocationOptions,
): MyLocationControl {
  if (options !== undefined) {
    checkOptions(options, child(root("createMyLocationControl"), "options"));
  }
  const unavailable = options?.unavailableLabel ?? "Location unavailable";
  const { control, button, status } = myLocationNodes(options?.label ?? "My location");
  carryStyles(LIST_STYLES);
  let latestAsk = 0;

  function pressed(): boolean {
    const { origin } = maplace.getSnapshot();
    return origin !== undefined && fromBrowser.has(origin);
  }

  function showPressed(): void {
    button.setAttribute("aria-pressed", String(pressed()));
  }

  /** Whichever ask is under way stops counting. */
  function settle(message: string): void {
    latestAsk += 1;
    button.removeAttribute("aria-busy");
    status.textContent = message;
  }

  function arrived({ coords }: GeolocationPosition): void {
    settle("");
    runSafely(() => {
      maplace.setOrigin({ lat: coords.latitude, lng: coords.longitude });
      const { origin, viewport } = maplace.getSnapshot();
      if (origin) {
        // Subscribers ran inside `setOrigin`, before the origin was in the set.
        fromBrowser.add(origin);
        showPressed();
        if (viewport) maplace.setView(origin, viewport.zoom);
      }
    });
  }

  function askOrClear(): void {
    settle("");
    if (pressed()) {
      runSafely(() => maplace.setOrigin(undefined));
    } else if (isSecureContext && navigator.geolocation) {
      button.setAttribute("aria-busy", "true");
      const ask = latestAsk;
      const whileLatest =
        <A>(answer: (argument: A) => void) =>
        (argument: A) => {
          if (ask === latestAsk) answer(argument);
        };
      navigator.geolocation.getCurrentPosition(
        whileLatest(arrived),
        whileLatest(() => settle(unavailable)),
        { timeout: READING_TIMEOUT_MS },
      );
    } else {
      status.textContent = unavailable;
    }
  }

  const unsubscribe = maplace.subscribe(showPressed);
  showPressed();
  button.addEventListener("click", askOrClear);
  return {
    element: control,
    destroy() {
      settle("");
      unsubscribe();
      control.remove();
    },
  };
}
