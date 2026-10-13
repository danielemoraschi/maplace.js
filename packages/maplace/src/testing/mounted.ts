import { createMaplace } from "../maplace/create";
import type { MaplaceOptions } from "../options";
import { CONTAINER } from "./container";
import { createFakeAdapter } from "./fake-adapter";

/** A store attached to a fake adapter, mounted and with its locations drawn: the map is ready. */
export async function mounted<Data = unknown>(options?: MaplaceOptions<Data>) {
  const maplace = createMaplace(options);
  const adapter = createFakeAdapter();
  const detach = maplace.attach(adapter, CONTAINER);
  await adapter.finishMount();
  // A large first diff draws in chunks, over several tasks.
  await maplace.whenReady();
  return { maplace, adapter, host: adapter.host(), detach };
}
