import type {
  Adapter,
  AdapterHost,
  Capability,
  LocationDiff,
  MountContext,
  PresentationState,
} from "../../adapter";
import type { MapSize } from "../../adapter-kit/web-mercator";
import type { Route } from "../../route";
import type { ResolvedView } from "../../viewport";
import type { MapProbe } from "../map-probe";

export interface FakeAdapterOptions {
  /** Default: every capability. */
  readonly capabilities?: readonly Capability[];
  readonly routeStopLimit?: number;
  /** Hold each `apply` until `finishApplies()`; by default it resolves once drawn. */
  readonly holdApplies?: boolean;
  /**
   * The map's size, read from its container when it settles; by default `MAP_SIZE`. The
   * conformance suite measures the container, so a hidden or resized one is seen.
   */
  readonly sizeOf?: (container: HTMLElement) => MapSize;
}

/** One call the store made, in order. */
export type FakeCall =
  | { readonly method: "apply"; readonly diff: LocationDiff }
  | { readonly method: "present"; readonly state: PresentationState }
  | { readonly method: "setView"; readonly view: ResolvedView }
  | { readonly method: "setRoute"; readonly route: Route | undefined };

/**
 * An in-memory map behind the adapter contract: it records what the store asks of it, draws
 * into a map state the probe reads, and passes the conformance suite. Mounting waits for the test
 * (`finishMount`, `failMount`), so tests see every load state.
 */
export interface FakeAdapter extends Adapter {
  readonly calls: readonly FakeCall[];
  readonly mounted: MountContext | undefined;
  readonly destroyed: boolean;
  /** The host from `mount`; throws before it. */
  host(): AdapterHost;
  finishMount(): Promise<void>;
  failMount(error: unknown): Promise<void>;
  finishApplies(): Promise<void>;
  /** The calls of one method, as their arguments. */
  callsOf<M extends FakeCall["method"]>(method: M): Extract<FakeCall, { method: M }>[];
  /** Sees and drives the map as a user would. */
  probe(): MapProbe;
}
