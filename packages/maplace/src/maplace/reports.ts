import type { AdapterHost } from "../adapter";
import type { ResolvedPopupOptions } from "../popup";
import { changeGeometry } from "../state/geometry-change";
import { hoverReported } from "../state/hover";
import { locationEdited } from "../state/location-edit";
import { mapClicked } from "../state/map-click";
import { popupClosed, popupOpened } from "../state/popup";
import { isStaleRouteFailure, setRouteResult } from "../state/route-result";
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
    reportSelectionChange: (id) => commitOwn(selectReported(getSnapshot(), id)),
    reportMapClick: (position) => commitOwn(mapClicked(getSnapshot(), position)),
    reportHoverChange: (id) => commitOwn(hoverReported(getSnapshot(), id)),
    reportLocationEdit: (id, geometry) =>
      commitOwn(locationEdited(getSnapshot(), { id, geometry })),
    reportLocationChange: (id, geometry) =>
      commitOwn(changeGeometry(getSnapshot(), { id, geometry })),
    reportPopupOpen: (id, element) => commitOwn(popupOpened(getSnapshot(), { id, element })),
    reportPopupClose: (id) => commitOwn(popupClosed(getSnapshot(), { id, openOn })),
    reportViewportChange: (viewport) => commitOwn(setViewport(getSnapshot(), viewport)),
    reportRouteChange: (route, result) =>
      commitOwn(setRouteResult(getSnapshot(), { route, result })),
    reportError(error, route) {
      if (!isStaleRouteFailure(getSnapshot(), error, route)) loadStates.reportError(error);
    },
  };
}
