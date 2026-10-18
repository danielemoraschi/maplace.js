import type { AdapterHost } from "../../adapter";
import { createRecorder } from "../recorder";

type Report = keyof AdapterHost;

/** One report an adapter made, with its arguments. */
export type HostReport = {
  [R in Report]: { readonly method: R; readonly args: Parameters<AdapterHost[R]> };
}[Report];

/** A host that only records, so checks see exactly what an adapter reported. */
export interface RecordingHost extends AdapterHost {
  readonly reports: readonly HostReport[];
  /** The arguments of each report of one kind, in order. */
  reportsOf<R extends Report>(report: R): Parameters<AdapterHost[R]>[];
  /** The reports of the kinds given, in the order made, each as its method and arguments. */
  reportsIn(...kinds: readonly Report[]): readonly unknown[][];
}

export function createRecordingHost(): RecordingHost {
  const recorder = createRecorder<HostReport>();
  const recording =
    <R extends Report>(method: R) =>
    (...args: Parameters<AdapterHost[R]>) =>
      recorder.record({ method, args } as HostReport);
  return {
    reports: recorder.entries,
    reportsOf: (report) =>
      recorder
        .entriesOf(report)
        .map((entry) => entry.args as Parameters<AdapterHost[typeof report]>),
    reportsIn: (...kinds) =>
      recorder.entries
        .filter(({ method }) => kinds.includes(method))
        .map(({ method, args }) => [method, ...args]),
    reportSelectionChange: recording("reportSelectionChange"),
    reportMapClick: recording("reportMapClick"),
    reportHoverChange: recording("reportHoverChange"),
    reportLocationEdit: recording("reportLocationEdit"),
    reportLocationChange: recording("reportLocationChange"),
    reportPopupOpen: recording("reportPopupOpen"),
    reportPopupClose: recording("reportPopupClose"),
    reportViewportChange: recording("reportViewportChange"),
    reportRouteChange: recording("reportRouteChange"),
    reportError: recording("reportError"),
  };
}
