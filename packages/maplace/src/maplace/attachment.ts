import type { Adapter, AdapterHost } from "../adapter";
import type { MaplaceOptions } from "../options";
import type { CommitHooks } from "../state/core";
import { runSafely } from "../state/safely";
import type { InternalState } from "../state/state";
import { checkAttachable, markUsed } from "./attachable";
import type { SupportCheck } from "./capabilities";
import { createHost } from "./host";
import { createLoadStates } from "./load";
import { resolvePopup } from "./popup";
import type { Readiness } from "./ready";
import { createReports } from "./reports";
import { type AdapterSync, createAdapterSync } from "./sync";

/** What `attach` works with: the store's state, its readiness and its options. */
export interface AttachContext<Data> {
  readonly state: InternalState<Data>;
  readonly readiness: Readiness;
  readonly options: MaplaceOptions<Data> | undefined;
}

/** Connects a store to one adapter at a time; its commit hooks keep that adapter in step. */
export interface Attacher<Data> extends CommitHooks<Data> {
  attach(adapter: Adapter, container: HTMLElement): () => void;
  detach(): void;
}

interface Connection {
  readonly adapter: Adapter;
  readonly controller: AbortController;
  readonly host: AdapterHost;
  readonly checkSupport: SupportCheck;
  readonly sync: AdapterSync;
}

export function createAttacher<Data>({
  state,
  readiness,
  options,
}: AttachContext<Data>): Attacher<Data> {
  const loadStates = createLoadStates(state, readiness);
  const { getSnapshot } = state.store;
  const drawOptions = { sanitize: options?.sanitize, style: options?.style };
  const popup = resolvePopup(options);
  const reports = createReports({ state, loadStates, openOn: popup.openOn });
  const cluster = options?.cluster ?? false;
  let current: Connection | undefined;

  function attach(adapter: Adapter, container: HTMLElement): () => void {
    state.checkNotDestroyed("attach");
    const store = { attached: current !== undefined, cluster, snapshot: getSnapshot() };
    const checkSupport = checkAttachable({ adapter, container }, store);
    markUsed(adapter);
    const controller = new AbortController();
    const host = createHost(controller.signal, reports);
    // The page's icon and content code runs while the adapter draws: its failures report as the
    // adapter's would, and are ignored once detached.
    const draw = { ...drawOptions, report: host.reportError };
    const sync = createAdapterSync({ adapter, getSnapshot, draw });
    const connection = { adapter, controller, host, checkSupport, sync };
    current = connection;
    loadStates.loading();
    void mount(connection, container);
    return () => detach(connection);
  }

  /** Loads the map, then draws the store into it; a detach on the way stops it quietly. */
  async function mount(connection: Connection, container: HTMLElement): Promise<void> {
    const {
      adapter,
      controller: { signal },
      host,
      sync,
    } = connection;
    try {
      // Awaited inside the try, so a mount that throws instead of rejecting fails the load too.
      await adapter.mount({ container, host, signal, cluster, popup });
      if (signal.aborted) return;
      await sync.start();
      if (!signal.aborted) loadStates.ready();
    } catch (error) {
      if (!signal.aborted) loadStates.failed(error);
    }
  }

  function detach(connection: Connection | undefined): void {
    if (connection === undefined || connection !== current) return;
    current = undefined;
    connection.controller.abort();
    runSafely(() => connection.adapter.destroy());
    loadStates.idle();
  }

  return {
    attach,
    detach: () => detach(current),
    beforeCommit: (candidate, method) => current?.checkSupport(candidate, method),
    afterCommit: () => current?.sync.update(),
  };
}
