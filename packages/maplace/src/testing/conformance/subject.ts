import type { Adapter, Capability } from "../../adapter";
import type { MapProbe } from "../map-probe";

/** An adapter under test, with the probe that sees and drives its map. */
export interface ConformanceSubject {
  /** Names the adapter in every check, e.g. `fake` or `google`. */
  readonly name: string;
  /** A new adapter for one check, and its probe; checks mount it in a `MAP_SIZE` container. */
  create(): { readonly adapter: Adapter; readonly probe: MapProbe };
}

/** What a subject's adapters support, read once when the checks register. */
export type Supports = ReadonlySet<Capability>;

/** One group of checks, registered for a subject; groups with capability checks read `supports`. */
export type CheckGroup = (subject: ConformanceSubject, supports: Supports) => void;
