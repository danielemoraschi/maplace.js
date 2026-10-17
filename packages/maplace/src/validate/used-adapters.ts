import { child, reject, root } from "./fail";

// One adapter instance drives one map for its whole life (RFC §3), so one attached before, to
// any store, is refused. Weak, so adapters are still collected. Typed loosely: an adapter that
// wraps another (the React binding's) marks the one inside too.
const USED_ADAPTERS = new WeakSet<object>();

/** Throws `already-attached`, as `attach` reports it, for an adapter attached before. */
export function refuseUsedAdapter(adapter: object): void {
  if (isUsed(adapter)) {
    const problem = "was attached before; create a new adapter for every attach";
    reject(child(root("attach"), "adapter"), problem, "already-attached");
  }
}

/** From now on, `refuseUsedAdapter` refuses this adapter. */
export function markUsed(adapter: object): void {
  USED_ADAPTERS.add(adapter);
}

/** Whether an adapter was attached before, so `attach` will refuse it. */
export function isUsed(adapter: object): boolean {
  return USED_ADAPTERS.has(adapter);
}
