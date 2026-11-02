import type { Adapter, MountContext } from "../adapter";
import { createMapFailureNotice, PAGE_MAP_FAILURES } from "../adapter-kit/map-failure";

/**
 * `adapter`, mounting only once `beforeMount` resolved: the store mounts as soon as it attaches,
 * while Maps JS may still be on its way. Maps JS failing here, outside `adapter`'s mount, says so
 * on the map as a failure inside it does. Everything else is `adapter`'s own (a plain object of
 * closures); `mountControl` and `destroy` already work before a mount.
 */
export function mountAfter(
  adapter: Adapter,
  beforeMount: (context: MountContext) => Promise<void>,
): Adapter {
  const failures = adapter.pageMapElement ? PAGE_MAP_FAILURES : createMapFailureNotice();
  const waiting = failures.mounting(beforeMount);
  return {
    ...adapter,
    async mount(context) {
      await waiting(context);
      return adapter.mount(context);
    },
    destroy() {
      adapter.destroy();
      failures.clear();
    },
  };
}
