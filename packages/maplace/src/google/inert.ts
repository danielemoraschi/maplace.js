import type { Adapter } from "../adapter";

type NotYetDrawn = "setView" | "setRoute" | "mountControl";

/**
 * The contract methods this adapter doesn't draw yet: each takes its call and leaves the map as
 * it is. Each row from G4 to G8 replaces its method in `assemble.ts`; the last one deletes this
 * file.
 */
export const INERT_METHODS: Pick<Adapter, NotYetDrawn> = {
  setView: () => {},
  setRoute: () => {},
  mountControl: () => () => {},
};
