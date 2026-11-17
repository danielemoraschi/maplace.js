import { MaplaceError } from "../errors";

/**
 * A part of an adapter loaded only when a store asks for it (`import()`, which bundlers split
 * off): its failure fails the mount as `provider-load-failed`, naming the part.
 */
export function loadOnDemand<Module>(part: string, load: () => Promise<Module>): Promise<Module> {
  return load().catch((cause: unknown) => {
    throw new MaplaceError("provider-load-failed", `mount: maplace's ${part} failed to load`, {
      cause,
    });
  });
}
