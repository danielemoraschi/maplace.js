/**
 * Draft of the 1.x React binding: types only. Exported under the development-only
 * `maplace:source` condition so examples import `maplace/react` as users will.
 */
import type { ReactNode } from "react";
import type { Adapter } from "../adapter";
import type { MaplaceEventName, MaplaceEvents } from "../events";
import type { ListEntry, ListViewOptions } from "../list-view";
import type { Location } from "../location";
import type { Maplace, MaplaceOptions, Snapshot } from "../store";

/** `onSelect`, `onChange`, … for every event, derived so none is left out. */
export type MaplaceEventProps<Data = unknown> = {
  readonly [K in MaplaceEventName as `on${Capitalize<K>}`]?: (
    event: MaplaceEvents<Data>[K],
  ) => void;
};

/** State a React app may control; the rest stays inside the store. */
export type MaplaceControlledProps = Partial<Pick<Snapshot, "selectedId" | "filter" | "route">>;

export interface MaplaceProviderProps<Data = unknown>
  extends Omit<MaplaceOptions<Data>, "locations" | "selectedId">,
    MaplaceControlledProps,
    MaplaceEventProps<Data> {
  readonly locations: readonly Location<Data>[];
  readonly children?: ReactNode;
}

export declare function MaplaceProvider<Data>(props: MaplaceProviderProps<Data>): ReactNode;

export interface MaplaceMapProps {
  /** Called once per mount; an adapter instance drives one map. */
  readonly createAdapter: () => Adapter;
  readonly className?: string;
}

/** Attaches on mount and detaches on unmount, so StrictMode and adapter swaps just work. */
export declare function MaplaceMap(props: MaplaceMapProps): ReactNode;

export interface LocationListProps<Data = unknown>
  extends Pick<ListViewOptions<Data>, "as" | "groupHeadings" | "fitAllLabel"> {
  readonly children?: (entry: ListEntry<Data>) => ReactNode;
}

export declare function LocationList<Data>(props: LocationListProps<Data>): ReactNode;

/** The store of the nearest `<MaplaceProvider>`. */
export declare function useMaplace<Data = unknown>(): Maplace<Data>;
