import type { Capability } from "../adapter";

// Complete record: a capability added to the contract fails to compile here until listed.
const CAPABILITIES: Readonly<Record<Capability, true>> = {
  route: true,
  cluster: true,
  circle: true,
  edit: true,
};

/** Every capability the contract names. */
export const EVERY_CAPABILITY = Object.keys(CAPABILITIES) as readonly Capability[];
