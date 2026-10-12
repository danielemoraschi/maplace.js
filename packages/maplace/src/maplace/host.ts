import type { AdapterHost } from "../adapter";
import type { MaplaceError } from "../errors";

const ignore = (): void => {};

/**
 * The host one attachment hands its adapter. Once detached, the adapter's late reports (a load
 * finishing, a callback firing) are ignored: they describe a map the store no longer shows.
 */
export function createHost(
  signal: AbortSignal,
  reportError: (error: MaplaceError) => void,
): AdapterHost {
  return {
    reportSelect: ignore,
    reportHover: ignore,
    reportChange: ignore,
    reportPopupOpen: ignore,
    reportPopupClose: ignore,
    reportViewport: ignore,
    reportRoute: ignore,
    reportError(error) {
      if (!signal.aborted) reportError(error);
    },
  };
}
