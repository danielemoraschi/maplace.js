/**
 * Draft of the 1.x React binding: types only. Exported under the development-only
 * `maplace:source` condition so examples import `maplace/react` as users will.
 */
import type { ReactNode } from "react";
import type { Adapter } from "../adapter";
import type { Listener, MaplaceEventName } from "../events";
import type { ListEntry, ListViewOptions } from "../list-view";
import type { Location } from "../location";
import type { Maplace, MaplaceOptions, Snapshot } from "../store";

/** `onSelect`, `onChange`, … for every event, derived so none is left out. */
export type MaplaceEventProps<Data = unknown> = {
  readonly [K in MaplaceEventName as `on${Capitalize<K>}`]?: Listener<K, Data> | undefined;
};

/** State a React app may control; the rest stays inside the store. */
export type MaplaceControlledProps = Partial<Pick<Snapshot, "selectedId" | "filter" | "route">>;

/**
 * Creates the store on mount. `locations` and the controlled props follow later renders; the
 * other options are read once, so inline objects and functions cost nothing.
 */
export interface MaplaceProviderProps<Data = unknown>
  extends Omit<MaplaceOptions<Data>, "locations" | "selectedId">,
    MaplaceControlledProps,
    MaplaceEventProps<Data> {
  readonly locations: readonly Location<Data>[];
  /** Initial selection when `selectedId` is not controlled (0.2's `start`). */
  readonly defaultSelectedId?: string | undefined;
  readonly children?: ReactNode | undefined;
}

export declare function MaplaceProvider<Data>(props: MaplaceProviderProps<Data>): ReactNode;

export interface MaplaceMapProps {
  /** Called once per mount; an adapter instance drives one map. */
  readonly createAdapter: () => Adapter;
  readonly className?: string | undefined;
}

/** Attaches on mount and detaches on unmount, so StrictMode and adapter swaps just work. */
export declare function MaplaceMap(props: MaplaceMapProps): ReactNode;

export interface LocationListProps<Data = unknown>
  extends Pick<ListViewOptions<Data>, "as" | "groupHeadings" | "fitAllLabel"> {
  readonly children?: ((entry: ListEntry<Data>) => ReactNode) | undefined;
}

export declare function LocationList<Data>(props: LocationListProps<Data>): ReactNode;

/** The store of the nearest `<MaplaceProvider>`. `Data` is not checked: match the provider's. */
export declare function useMaplace<Data = unknown>(): Maplace<Data>;
