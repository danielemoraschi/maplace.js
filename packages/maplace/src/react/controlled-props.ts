import { sameFilter, sameOptional, sameRoute } from "../diff/same";
import { MaplaceError } from "../index";
import { isSelectable, isShown } from "../location-state";
import type { Maplace } from "../store";
import type { MaplaceControlledProps, MaplaceProviderProps } from "./provider-props";

type Props<Data> = MaplaceProviderProps<Data>;

/** Brings the store in step with a provider's props, after each render. */
export interface PropFollower<Data> {
  follow(props: Props<Data>): void;
  /**
   * Hears a `selectionChange` the store fired, and says whether it goes on to
   * `onSelectionChange`. The provider's own changes don't; a selection a controlled prop doesn't
   * name does, and asks the provider to render, after which the store goes back to the prop
   * unless the parent passed the new id.
   */
  heardSelection(id: string | undefined, props: Props<Data>): boolean;
}

/** The selection to create the store with: the wanted id, if the first locations show it. */
export function initialSelectedId<Data>(props: Props<Data>): string | undefined {
  const id = isControlled(props) ? props.selectedId : props.defaultSelectedId;
  // The caller's own array, not a frozen snapshot list, so not looked up through the cached index.
  const shown = props.locations.some(
    (location) => location.id === id && isShown(location, props.filter),
  );
  return shown ? id : undefined;
}

export function createPropFollower<Data>(
  store: Maplace<Data>,
  initial: Props<Data>,
  rerender: () => void,
): PropFollower<Data> {
  const controlled = isControlled(initial);
  if (controlled && initial.defaultSelectedId !== undefined) {
    throw providerMisuse("takes selectedId or defaultSelectedId, not both", "defaultSelectedId");
  }
  let appliedLocations = initial.locations;
  let waitingDefault = initial.defaultSelectedId;
  let appliedFilter: Props<Data>["filter"];
  let appliedRoute: Props<Data>["route"];
  let following = false;

  function followSelection(props: Props<Data>): void {
    if (controlled) selectOnly(props.selectedId);
    else if (waitingDefault !== undefined) selectWaitingDefault(waitingDefault);
  }

  /** The store's selection made the prop's, or none while the prop's isn't shown. */
  function selectOnly(wanted: string | undefined): void {
    const snapshot = store.getSnapshot();
    const next = wanted !== undefined && isSelectable(snapshot, wanted) ? wanted : undefined;
    if (snapshot.selectedId !== next) store.select(next);
  }

  /** A default id waits for its location, unless something else is selected first. */
  function selectWaitingDefault(id: string): void {
    const snapshot = store.getSnapshot();
    if (snapshot.selectedId !== undefined) {
      waitingDefault = undefined;
    } else if (isSelectable(snapshot, id)) {
      waitingDefault = undefined;
      store.select(id);
    }
  }

  /** `locations` applied when its array changes; a `filter` or `route` prop when its value does. */
  function followValues(props: Props<Data>): void {
    if (props.locations !== appliedLocations) {
      store.setLocations(props.locations);
      appliedLocations = props.locations;
    }
    if (Object.hasOwn(props, "filter") && !sameFilter(props.filter, appliedFilter)) {
      store.setFilter(props.filter);
      appliedFilter = props.filter;
    }
    if (Object.hasOwn(props, "route") && !sameOptional(props.route, appliedRoute, sameRoute)) {
      store.setRoute(props.route);
      appliedRoute = props.route;
    }
  }

  return {
    follow(props) {
      if (isControlled(props) !== controlled) {
        throw providerMisuse("selectedId can't become controlled or uncontrolled", "selectedId");
      }
      following = true;
      try {
        followValues(props);
        followSelection(props);
      } finally {
        following = false;
      }
    },
    heardSelection(id, props) {
      if (!controlled) return true;
      if (following || id === props.selectedId) return false;
      rerender();
      return true;
    },
  };
}

/** Controlled when the prop is there, even as `undefined` (nothing selected). */
function isControlled(props: MaplaceControlledProps): boolean {
  return Object.hasOwn(props, "selectedId");
}

function providerMisuse(problem: string, field: string): MaplaceError {
  return new MaplaceError("invalid-input", `<MaplaceProvider>: ${problem}`, { field });
}
