import type { Adapter, MountContext } from "../adapter";

/**
 * `adapter`, mounting only once `beforeMount` resolved: the store mounts as soon as it attaches,
 * while Maps JS may still be on its way. Everything else is `adapter`'s own (a plain object of
 * closures); `mountControl` and `destroy` already work before a mount.
 */
export function mountAfter(
  adapter: Adapter,
  beforeMount: (context: MountContext) => Promise<void>,
): Adapter {
  return {
    ...adapter,
    async mount(context) {
      await beforeMount(context);
      return adapter.mount(context);
    },
  };
}
