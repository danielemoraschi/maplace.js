import type { Adapter } from "../adapter";
import type { Snapshot } from "../store";
import { checkAdapter, checkContainer } from "../validate/attach";
import { child, reject, root } from "../validate/fail";
import { refuseUsedAdapter } from "../validate/used-adapters";
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
  refuseUsedAdapter(adapter);
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
