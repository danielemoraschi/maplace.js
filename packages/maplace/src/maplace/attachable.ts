import type { Adapter } from "../adapter";
import type { Snapshot } from "../store";
import { checkAdapter, checkContainer } from "../validate/attach";
import { child, reject, root } from "../validate/fail";
import { checkCluster, createSupportCheck, type SupportCheck } from "./capabilities";

/** What `attach` was given. */
export interface AttachRequest {
  readonly adapter: Adapter;
  readonly container: HTMLElement;
}

/** The store as `attach` finds it. */
export interface StoreAtAttach {
  readonly attached: boolean;
  readonly cluster: boolean;
  readonly snapshot: Snapshot;
}

const ATTACH = root("attach");

// One adapter instance drives one map for its whole life (RFC §3), so one attached before, to
// any store, is refused. Weak, so adapters are still collected.
const USED_ADAPTERS = new WeakSet<Adapter>();

/**
 * Throws on every misuse of `attach`, in the RFC's order, before anything changes. Returns the
 * adapter's support check, already run against the snapshot.
 */
export function checkAttachable(
  { adapter, container }: AttachRequest,
  { attached, cluster, snapshot }: StoreAtAttach,
): SupportCheck {
  if (attached) {
    reject(ATTACH, "this maplace is already attached; call detach first", "already-attached");
  }
  checkAdapter(adapter, child(ATTACH, "adapter"));
  if (USED_ADAPTERS.has(adapter)) {
    const problem = "was attached before; create a new adapter for every attach";
    reject(child(ATTACH, "adapter"), problem, "already-attached");
  }
  checkContainer(container, child(ATTACH, "container"));
  if (adapter.pageMapElement && !container.contains(adapter.pageMapElement)) {
    const problem = "must be the element of the page's map the adapter draws on, or hold it";
    reject(child(ATTACH, "container"), problem);
  }
  if (cluster) checkCluster(adapter, child(child(ATTACH, "options"), "cluster"));
  const checkSupport = createSupportCheck(adapter);
  checkSupport(snapshot, "attach");
  return checkSupport;
}

/** From now on, `checkAttachable` refuses this adapter. */
export function markUsed(adapter: Adapter): void {
  USED_ADAPTERS.add(adapter);
}
