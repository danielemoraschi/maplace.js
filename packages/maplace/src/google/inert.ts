import type { Adapter } from "../adapter";

type NotYetDrawn = "apply" | "present" | "setView" | "setRoute" | "mountControl";

/**
 * The contract methods this adapter doesn't draw yet: each takes its call and leaves the map as it
 * is (`apply` resolves at once, as the contract requires). Each row from G2 to G8 replaces its
 * method in `assemble.ts`; the last one deletes this file.
 */
export const INERT_METHODS: Pick<Adapter, NotYetDrawn> = {
  apply: () => Promise.resolve(),
  present: () => {},
  setView: () => {},
  setRoute: () => {},
  mountControl: () => () => {},
};
