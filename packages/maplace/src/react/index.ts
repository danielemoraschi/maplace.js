/**
 * Draft of the 1.x React binding: types only. Exported under the development-only
 * `maplace:source` condition so examples import `maplace/react` as users will.
 */
import type { ReactNode } from "react";
import type { Adapter } from "../adapter";
import type { MaplaceEventName, MaplaceEvents } from "../events";
import type { Location } from "../location";
import type { Maplace, MaplaceOptions, Snapshot } from "../store";
import type { ListEntry, ListViewOptions } from "../view";

/** `onSelect`, `onChange`, … for every event, derived so none is left out. */
export type MaplaceEventProps = {
  readonly [K in MaplaceEventName as `on${Capitalize<K>}`]?: (event: MaplaceEvents[K]) => void;
};

/** State a React app may control; the rest stays inside the store. */
export type MaplaceControlledProps = Partial<Pick<Snapshot, "selectedId" | "filter" | "route">>;

export interface MaplaceProviderProps
  extends Omit<MaplaceOptions, "locations">,
    MaplaceControlledProps,
    MaplaceEventProps {
  readonly locations: readonly Location[];
  readonly children?: ReactNode;
}

export declare function MaplaceProvider(props: MaplaceProviderProps): ReactNode;

export interface MaplaceMapProps {
  readonly adapter: Adapter;
  readonly className?: string;
}

/** Attaches on mount and detaches on unmount, so StrictMode and adapter swaps just work. */
export declare function MaplaceMap(props: MaplaceMapProps): ReactNode;

export interface LocationListProps extends Pick<ListViewOptions, "as" | "groupHeadings"> {
  readonly children?: (entry: ListEntry) => ReactNode;
}

export declare function LocationList(props: LocationListProps): ReactNode;

/** The store of the nearest `<MaplaceProvider>`. */
export declare function useMaplace(): Maplace;
