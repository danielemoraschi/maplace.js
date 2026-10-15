import { onProviderRegistered } from "./providers";

/** Tries a failed setup again when what it lacked may have come. */
export interface SetupRetry {
  /** From now on, retries on each change of `host`'s attributes, and on a provider registered. */
  wait(): void;
  stop(): void;
}

/** A provider attribute set later, or the provider registered later, may be what was missing. */
export function createSetupRetry(host: Element, retry: () => void): SetupRetry {
  const attributesWatch = new MutationObserver(retry);
  let stopWaitingForProvider: (() => void) | undefined;
  return {
    wait() {
      attributesWatch.observe(host, { attributes: true });
      stopWaitingForProvider ??= onProviderRegistered(retry);
    },
    stop() {
      attributesWatch.disconnect();
      stopWaitingForProvider?.();
      stopWaitingForProvider = undefined;
    },
  };
}
