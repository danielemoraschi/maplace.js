import type { AdapterHost } from "../adapter";
import { runSafely } from "../state/safely";

/**
 * The host one attachment hands its adapter. Once detached, the adapter's late reports (a load
 * finishing, a callback firing) are ignored: they describe a map the store no longer shows. A
 * report that throws is the adapter's bug: it changes nothing, and is rethrown in a microtask
 * rather than back into the adapter.
 */
export function createHost(signal: AbortSignal, reports: AdapterHost): AdapterHost {
  const whileAttached =
    <A extends unknown[]>(report: (...args: A) => void) =>
    (...args: A): void => {
      if (!signal.aborted) runSafely(() => report(...args));
    };
  return {
    reportSelectionChange: whileAttached(reports.reportSelectionChange),
    reportMapClick: whileAttached(reports.reportMapClick),
    reportHoverChange: whileAttached(reports.reportHoverChange),
    reportLocationEdit: whileAttached(reports.reportLocationEdit),
    reportLocationChange: whileAttached(reports.reportLocationChange),
    reportPopupOpen: whileAttached(reports.reportPopupOpen),
    reportPopupClose: whileAttached(reports.reportPopupClose),
    reportViewportChange: whileAttached(reports.reportViewportChange),
    reportRouteChange: whileAttached(reports.reportRouteChange),
    reportError: whileAttached(reports.reportError),
  };
}
