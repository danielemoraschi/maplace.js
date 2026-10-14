import type { Adapter } from "../adapter";

/**
 * The contract method this adapter doesn't draw yet: it takes its call and leaves the map as it
 * is. G6 replaces it in `assemble.ts` and deletes this file.
 */
export const INERT_METHODS: Pick<Adapter, "setRoute"> = {
  setRoute: () => {},
};
