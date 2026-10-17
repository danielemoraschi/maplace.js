import type { Location } from "../../location";
import { CONTAINER } from "../../testing/container";
import { createFakeAdapter } from "../../testing/fake-adapter";
import type { MaplaceProviderProps } from "../provider-props";
import { bindStore } from "../store-binding";

/** Three markers, for selections and filters: `north` in group N, `south` in S, `east` in neither. */
export const TOWNS: readonly Location[] = [
  { id: "north", lat: 46, lng: 11, group: "N" },
  { id: "south", lat: 40, lng: 16, group: "S" },
  { id: "east", lat: 43, lng: 13 },
];

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
