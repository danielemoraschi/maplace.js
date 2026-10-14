import type { Adapter } from "../adapter";

type NotYetDrawn = "setRoute" | "mountControl";

/**
 * The contract methods this adapter doesn't draw yet: each takes its call and leaves the map as
 * it is. Rows G6 and G8 replace their methods in `assemble.ts`; the last one deletes this
 * file.
 */
export const INERT_METHODS: Pick<Adapter, NotYetDrawn> = {
  setRoute: () => {},
  mountControl: () => () => {},
};
