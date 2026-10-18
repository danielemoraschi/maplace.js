import {
  type Listener,
  MAPLACE_EVENT_NAME_LIST,
  type MaplaceEventName,
  type MaplaceEvents,
} from "../events";
import { createMaplace } from "../index";
import type { MaplaceOptions } from "../options";
import type { Maplace } from "../store";
import { createPropFollower, initialSelectedId } from "./controlled-props";
import type { Latest } from "./hooks";
import type { EventPropName, MaplaceProviderProps, MountOptions } from "./provider-props";

type Props<Data> = MaplaceProviderProps<Data>;

/** A provider's store, made once, and how it follows the provider's props. */
export interface StoreBinding<Data> {
  readonly store: Maplace<Data>;
  /** Brings the store in step with the latest props; run after every render. */
  follow(): void;
}

/**
 * Makes the store with the props of the first render, brings it to their filter, route and
 * selection, then listens for every event: in that order, so the starting state is no event, and
 * an event from a child's first effect, which runs before the provider's, still reaches its prop.
 */
export function bindStore<Data>(
  latest: Latest<Props<Data>>,
  rerender: () => void,
): StoreBinding<Data> {
  const props = latest.current;
  const store = createMaplace<Data>({
    ...mountOptionsOf(props),
    locations: props.locations,
    selectedId: initialSelectedId(props),
  });
  const follower = createPropFollower(store, props, rerender);
  follower.follow(props);
  forwardEvent(store, "selectionChange", latest, ({ id }) =>
    follower.reportsSelectionChange(id, latest.current),
  );
  for (const name of MAPLACE_EVENT_NAME_LIST) {
    if (name !== "selectionChange") forwardEvent(store, name, latest);
  }
  return { store, follow: () => follower.follow(latest.current) };
}

/** The listener prop of an event: `selectionChange` → `onSelectionChange`. */
export function eventPropName<K extends MaplaceEventName>(name: K): EventPropName<K> {
  return `on${name.charAt(0).toUpperCase()}${name.slice(1)}` as EventPropName<K>;
}

/** Passes an event to its prop in the latest props, when `reports` (if any) lets it through. */
function forwardEvent<Data, K extends MaplaceEventName>(
  store: Maplace<Data>,
  name: K,
  latest: Latest<Props<Data>>,
  reports?: (event: MaplaceEvents<Data>[K]) => boolean,
): void {
  const prop = eventPropName(name);
  store.on(name, (event) => {
    if (reports && !reports(event)) return;
    (latest.current[prop] as Listener<K, Data> | undefined)?.(event);
  });
}

/** Every option read once, named so a new one fails to compile until it is passed on. */
function mountOptionsOf<Data>(props: Props<Data>): MaplaceOptions<Data> {
  const { sanitize, popup, style, selectedStyle, hoveredStyle, cluster, view } = props;
  return { sanitize, popup, style, selectedStyle, hoveredStyle, cluster, view } satisfies Record<
    keyof MountOptions<Data>,
    unknown
  >;
}
