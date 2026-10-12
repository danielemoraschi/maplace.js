import type { AdapterHost } from "../adapter";
import type { ResolvedPopupOptions } from "../popup";
import { changeGeometry } from "../state/geometry-change";
import { hover } from "../state/hover";
import { popupClosed, popupOpened } from "../state/popup";
import { setRouteResult } from "../state/route-result";
import { selectReported } from "../state/select-report";
import type { InternalState } from "../state/state";
import { setViewport } from "../state/viewport";
import type { LoadStates } from "./load";

interface ReportContext<Data> {
  readonly state: InternalState<Data>;
  readonly loadStates: LoadStates;
  readonly openOn: ResolvedPopupOptions["openOn"];
}

/**
 * What each report from the map does to the store. Every report commits as the store's own
 * change: the map is telling what already happened, so nothing is refused.
 */
export function createReports<Data>({
  state,
  loadStates,
  openOn,
}: ReportContext<Data>): AdapterHost {
  const { commitOwn } = state;
  const { getSnapshot } = state.store;
  return {
    reportSelect: (id) => commitOwn(selectReported(getSnapshot(), id)),
    reportHover: (id) => commitOwn(hover(getSnapshot(), id)),
    reportChange: (id, geometry) => commitOwn(changeGeometry(getSnapshot(), { id, geometry })),
    reportPopupOpen: (id, element) => commitOwn(popupOpened(getSnapshot(), { id, element })),
    reportPopupClose: (id) => commitOwn(popupClosed(getSnapshot(), { id, openOn })),
    reportViewport: (viewport) => commitOwn(setViewport(getSnapshot(), viewport)),
    reportRoute: (result) => commitOwn(setRouteResult(getSnapshot(), result)),
    reportError: loadStates.reportError,
  };
}
