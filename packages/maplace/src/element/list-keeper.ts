import type { Maplace } from "../index";
import { type ElementList, listFromAttributes } from "./element-list";
import { namesListView, onListViewDefined } from "./list-views";
import { oncePerTask } from "./once-per-task";
import type { StandingMisuse } from "./standing-misuse";

/**
 * The element's list: built when the map opens, built again when its attributes change, or when
 * a list view it names is defined.
 */
export interface ListKeeper {
  readonly list: ElementList | undefined;
  /** Builds the list unless one stands. */
  open(): void;
  /** Builds it again, once for the list attributes a page sets together (a microtask). */
  rebuildSoon(): void;
  /** Puts a list beside the map back, when the page replaced the element's children. */
  restore(): void;
  /** Stops waiting for list views to be defined (the element left the page). */
  stop(): void;
}

export function createListKeeper(
  host: HTMLElement,
  parts: {
    readonly store: Maplace;
    readonly misuse: StandingMisuse;
    /** Shows a list built again on the open map, if any. */
    readonly show: (list: ElementList | undefined) => void;
  },
): ListKeeper {
  let list: ElementList | undefined;
  let stopWaiting: (() => void) | undefined;
  const build = () => listFromAttributes(host, parts.store);

  /** Builds the list again; `retry` reports only a misuse that differs from the one standing. */
  function rebuild(how: "attempt" | "retry"): void {
    const previous = list;
    // Gone before the page's code runs: a destroy or build that throws leaves no stale list.
    list = undefined;
    if (previous) parts.misuse.attempt("list", previous.destroy);
    list = parts.misuse[how]("list", build);
    parts.show(list);
    waitWhileRefused();
  }

  /** A list naming a view not defined yet is built once one is, while the element is on the page. */
  function waitWhileRefused(): void {
    const name = host.getAttribute("list");
    if (name !== null && !namesListView(name) && host.isConnected) {
      stopWaiting ??= onListViewDefined(() => rebuild("retry"));
    } else {
      stop();
    }
  }

  function stop(): void {
    stopWaiting?.();
    stopWaiting = undefined;
  }

  return {
    get list() {
      return list;
    },
    open() {
      if (list === undefined) rebuild("retry");
    },
    rebuildSoon: oncePerTask(() => rebuild("attempt")),
    restore: () => list?.restore(),
    stop,
  };
}
