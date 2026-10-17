import type { ReactNode } from "react";
import type { Listener, MaplaceEventName } from "../events";
import type { Location } from "../location";
import type { MaplaceOptions } from "../options";
import type { Snapshot } from "../store";

/** The prop that takes an event's listener: `selectionChange` → `onSelectionChange`. */
export type EventPropName<K extends MaplaceEventName> = `on${Capitalize<K>}`;

/** `onSelectionChange`, `onLocationChange`, … for every event, derived so none is left out. */
export type MaplaceEventProps<Data = unknown> = {
  readonly [K in MaplaceEventName as EventPropName<K>]?: Listener<K, Data> | undefined;
};

/**
 * State a React app may control; the rest stays inside the store. A controlled `selectedId` is
 * the selection: one the user makes is reported by `onSelectionChange` and stays only if the next
 * render passes it back. A `filter` or `route` prop is applied when its value changes, as
 * `locations` is.
 */
export type MaplaceControlledProps = Partial<Pick<Snapshot, "selectedId" | "filter" | "route">>;

/** The options read once, when the store is made: changing them later changes nothing. */
export type MountOptions<Data = unknown> = Omit<MaplaceOptions<Data>, "locations" | "selectedId">;

/**
 * Creates the store on mount. `locations` and the controlled props follow later renders; the
 * other options are read once, so inline objects and functions cost nothing.
 */
export interface MaplaceProviderProps<Data = unknown>
  extends MountOptions<Data>,
    MaplaceControlledProps,
    MaplaceEventProps<Data> {
  /** Applied again when the array changes, never otherwise: edits on the map write back to the store. */
  readonly locations: readonly Location<Data>[];
  /**
   * Initial selection when `selectedId` is not controlled (0.2's `start`). An id not loaded yet
   * waits until it is, unless something else is selected first.
   */
  readonly defaultSelectedId?: string | undefined;
  readonly children?: ReactNode | undefined;
}
