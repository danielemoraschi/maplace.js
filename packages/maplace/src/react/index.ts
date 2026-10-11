/**
 * Draft of the 1.x React binding: types only, not in `exports`, kept here so the React
 * use cases type-check against the same core API.
 */
import type { ReactNode } from "react";
import type { Adapter } from "../adapter";
import type { MaplaceEvents } from "../events";
import type { Location } from "../location";
import type { Maplace, MaplaceOptions, Route } from "../store";
import type { ListEntry } from "../view";

export interface MaplaceProviderProps extends Omit<MaplaceOptions, "locations"> {
  readonly locations: readonly Location[];
  readonly route?: Route;
  readonly selectedId?: string;
  readonly onSelect?: (event: MaplaceEvents["select"]) => void;
  readonly onChange?: (event: MaplaceEvents["change"]) => void;
  readonly onError?: (event: MaplaceEvents["error"]) => void;
  readonly children?: ReactNode;
}

export declare function MaplaceProvider(props: MaplaceProviderProps): ReactNode;

export interface MaplaceMapProps {
  readonly adapter: Adapter;
  readonly className?: string;
}

export declare function MaplaceMap(props: MaplaceMapProps): ReactNode;

export interface LocationListProps {
  readonly as?: "list" | "select";
  readonly children?: (entry: ListEntry) => ReactNode;
}

export declare function LocationList(props: LocationListProps): ReactNode;

/** The store of the nearest `<MaplaceProvider>`. */
export declare function useMaplace(): Maplace;

export declare function useSelection(): string | undefined;
