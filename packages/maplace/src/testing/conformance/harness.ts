import type { Adapter, Capability } from "../../adapter";
import type { ResolvedPopupOptions } from "../../popup";
import { MAP_SIZE, type MapProbe } from "../map-probe";
import { createRecordingHost, type RecordingHost } from "./recording-host";
import type { ConformanceSubject } from "./subject";

/** One adapter mounted for a check, with everything the check reads or drives. */
export interface MountedSubject {
  readonly adapter: Adapter;
  readonly probe: MapProbe;
  readonly host: RecordingHost;
  readonly container: HTMLElement;
  readonly controller: AbortController;
  /** The adapter's mount, which `mountSubject` waits for. */
  readonly mounting: Promise<void>;
  /** Destroys the adapter; safe to call again, as cleanup does. */
  destroy(): void;
}

/** How the store would mount: clustering, and when popups open. */
export interface MountSettings {
  readonly cluster?: boolean;
  readonly openOn?: ResolvedPopupOptions["openOn"];
}

/** What cleanup takes down after each check. */
type Cleanup = Pick<MountedSubject, "controller" | "container" | "destroy">;

const live: Cleanup[] = [];

/** Mounts a new adapter in a container of `MAP_SIZE` and waits for the map. */
export async function mountSubject(
  subject: ConformanceSubject,
  settings?: MountSettings,
): Promise<MountedSubject> {
  const mounted = startMount(subject, settings);
  await mounted.mounting;
  return mounted;
}

/** Starts mounting without waiting for it, as the store does before a load completes. */
export function startMount(
  subject: ConformanceSubject,
  { cluster = false, openOn = "click" }: MountSettings = {},
): MountedSubject {
  const container = sizedContainer();
  const { adapter, probe } = subject.create();
  const host = createRecordingHost();
  const controller = new AbortController();
  const destroy = destroyOnce(adapter);
  // Registered before mounting, so a mount that throws still leaves nothing behind.
  live.push({ controller, container, destroy });
  const popup = { maxWidth: undefined, offset: [0, 0] as const, openOn };
  const mounting = adapter.mount({ container, host, signal: controller.signal, cluster, popup });
  return { adapter, probe, host, container, controller, mounting, destroy };
}

/** Takes down every map the last check mounted; `describeConformance` runs it after each. */
export function unmountAll(): void {
  for (const mounted of live.splice(0)) {
    mounted.controller.abort();
    mounted.destroy();
    mounted.container.remove();
  }
}

/** What the subject's adapters support, read once when the checks are registered. */
export function capabilitiesOf(subject: ConformanceSubject): ReadonlySet<Capability> {
  return subject.create().adapter.capabilities;
}

/** The adapter's `destroy`, safe to call again: a check may destroy before cleanup does. */
function destroyOnce(adapter: Adapter): () => void {
  let destroyed = false;
  return () => {
    if (!destroyed) adapter.destroy();
    destroyed = true;
  };
}

function sizedContainer(): HTMLElement {
  const container = document.createElement("div");
  container.style.width = `${MAP_SIZE.width}px`;
  container.style.height = `${MAP_SIZE.height}px`;
  document.body.append(container);
  return container;
}
