import type { MaplaceOptions } from "../options";
import { createInternalState } from "../state/state";
import type { Maplace } from "../store";
import { createAttacher } from "./attachment";
import { createReadiness } from "./ready";

/** A store for your locations; `attach` connects it to a map. */
export function createMaplace<Data = unknown>(options?: MaplaceOptions<Data>): Maplace<Data> {
  const state = createInternalState(options);
  const readiness = createReadiness();
  const attacher = createAttacher({ state, readiness, options });
  state.setHooks(attacher);
  return {
    ...state.store,
    attach: attacher.attach,
    whenReady: readiness.whenReady,
    destroy() {
      attacher.detach();
      state.store.destroy();
      readiness.close();
    },
  };
}
