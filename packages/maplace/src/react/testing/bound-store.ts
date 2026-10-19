import { CONTAINER } from "../../testing/container";
import { createFakeAdapter } from "../../testing/fake-adapter";
import type { MaplaceProviderProps } from "../provider-props";
import { bindStore } from "../store-binding";

/**
 * A provider's store without React: bound to `props` and attached to a ready fake map.
 * `render` stands for the provider's next render: new props, then the store following them.
 */
export async function boundStore<Data>(props: MaplaceProviderProps<Data>) {
  const latest = { current: props };
  let renders = 0;
  const binding = bindStore(latest, () => renders++);
  const adapter = createFakeAdapter();
  binding.store.attach(adapter, CONTAINER);
  await adapter.finishMount();
  await binding.store.whenReady();
  return {
    store: binding.store,
    adapter,
    host: adapter.host(),
    /** The renders the store asked for. */
    renders: () => renders,
    render(next: MaplaceProviderProps<Data>) {
      latest.current = next;
      binding.follow();
    },
  };
}
