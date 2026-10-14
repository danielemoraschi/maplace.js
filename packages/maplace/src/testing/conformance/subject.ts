import type { Adapter, Capability } from "../../adapter";
import type { MapProbe } from "../map-probe";

/** The suite's groups, one per tracker row: an adapter joins each as its row is built. */
export type ConformanceGroup =
  | "declarations"
  | "lifecycle"
  | "drawing"
  | "presentation"
  | "popups"
  | "camera"
  | "reports"
  | "route"
  | "cluster"
  | "controls";

/** An adapter under test, with the probe that sees and drives its map. */
export interface ConformanceSubject {
  /** Names the adapter in every check, e.g. `fake` or `google`. */
  readonly name: string;
  /** The groups this adapter is built for; all of them when omitted. */
  readonly groups?: readonly ConformanceGroup[] | undefined;
  /**
   * A new adapter for one check, and its probe. Checks mount it in `container`, of `MAP_SIZE`;
   * a subject drawing on a page's own map puts that map there first.
   */
  create(container: HTMLElement): { readonly adapter: Adapter; readonly probe: MapProbe };
}

/** What a subject's adapters support, read once when the checks register. */
export type Supports = ReadonlySet<Capability>;

/** One group of checks, registered for a subject; groups with capability checks read `supports`. */
export type CheckGroup = (subject: ConformanceSubject, supports: Supports) => void;
