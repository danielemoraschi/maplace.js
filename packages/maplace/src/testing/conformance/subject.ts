import type { Adapter, Capability } from "../../adapter";
import type { MapProbe } from "../map-probe";

/**
 * The suite's groups, one per part of the contract: an adapter joins each once it draws that part.
 */
export type ConformanceGroup =
  | "declarations"
  | "lifecycle"
  | "drawing"
  | "presentation"
  | "popups"
  | "camera"
  | "container"
  | "reports"
  | "editing"
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
   * Groups another subject of the same adapter proves, where this one would only repeat it: the
   * page's own map runs the same code as a created one once open, and every check makes a map.
   */
  readonly provedOn?: ProvedOn | undefined;
  /**
   * A new adapter for one check, and its probe. Checks mount it in `container`, of `MAP_SIZE`;
   * a subject drawing on a page's own map puts that map there first.
   */
  create(container: HTMLElement): { readonly adapter: Adapter; readonly probe: MapProbe };
}

/** Groups another subject proves, which runs them. */
export interface ProvedOn {
  readonly subject: ConformanceSubject;
  readonly groups: readonly ConformanceGroup[];
}

/**
 * Why `subject` skips `group`, as the suite labels it, or nothing when it runs the group: a group
 * shows as skipped, never as missing.
 */
export function skipReasonOf(
  { groups, provedOn }: ConformanceSubject,
  group: ConformanceGroup,
): string | undefined {
  if (groups !== undefined && !groups.includes(group)) return "not built yet";
  if (provedOn?.groups.includes(group)) return `proved on ${provedOn.subject.name}`;
  return undefined;
}

/** What a subject's adapters support, read once when the checks register. */
export type Supports = ReadonlySet<Capability>;

/** One group of checks, registered for a subject; groups with capability checks read `supports`. */
export type CheckGroup = (subject: ConformanceSubject, supports: Supports) => void;
