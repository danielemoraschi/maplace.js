import { createMaplace } from "../maplace/create";
import type { MaplaceOptions } from "../options";
import { CONTAINER } from "./container";
import { createFakeAdapter } from "./fake-adapter";

/** A store attached to a fake adapter, with the mount finished: the map is up. */
export async function mounted<Data = unknown>(options?: MaplaceOptions<Data>) {
  const maplace = createMaplace(options);
  const adapter = createFakeAdapter();
  const detach = maplace.attach(adapter, CONTAINER);
  await adapter.finishMount();
  return { maplace, adapter, host: adapter.host(), detach };
}
