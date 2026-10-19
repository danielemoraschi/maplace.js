import type { Adapter } from "../adapter";
import type { Snapshot } from "../store";
import { checkAdapter, containerOf } from "../validate/attach";
import { child, reject, root } from "../validate/fail";
import { refuseUsedAdapter } from "../validate/used-adapters";
import { checkCluster, createSupportCheck, type SupportCheck } from "./capabilities";

/** What `attach` was given. */
export interface AttachRequest {
  readonly adapter: Adapter;
  readonly container: HTMLElement | string;
}

/** What `attach` mounts with, once every check passed. */
export interface AttachCheck {
  /** The adapter's support check, already run against the snapshot. */
  readonly checkSupport: SupportCheck;
  /** The container, a selector resolved to the element it matches. */
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
 * Throws on every misuse of `attach`, in the RFC's order, before anything changes.
 */
export function checkAttachable(
  { adapter, container }: AttachRequest,
  { attached, cluster, snapshot }: StoreAtAttach,
): AttachCheck {
  if (attached) {
    reject(ATTACH, "this maplace is already attached; call detach first", "already-attached");
  }
  checkAdapter(adapter, child(ATTACH, "adapter"));
  refuseUsedAdapter(adapter);
  const element = containerOf(container, child(ATTACH, "container"));
  if (adapter.pageMapElement && !element.contains(adapter.pageMapElement)) {
    const problem = "must be the element of the page's map the adapter draws on, or hold it";
    reject(child(ATTACH, "container"), problem);
  }
  if (cluster) checkCluster(adapter, child(child(ATTACH, "options"), "cluster"));
  const checkSupport = createSupportCheck(adapter);
  checkSupport(snapshot, "attach");
  return { checkSupport, container: element };
}
