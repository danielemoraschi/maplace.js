import type { Adapter } from "../adapter";

/**
 * `adapter`, mounting only once `loading` resolved: the store mounts as soon as it attaches,
 * while Maps JS may still be on its way. Everything else is `adapter`'s own (a plain object of
 * closures); `mountControl` and `destroy` already work before a mount.
 */
export function adapterAfter(loading: Promise<void>, adapter: Adapter): Adapter {
  return {
    ...adapter,
    async mount(context) {
      await loading;
      return adapter.mount(context);
    },
  };
}
