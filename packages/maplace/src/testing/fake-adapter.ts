import type { MountContext } from "../adapter";
import { EVERY_CAPABILITY } from "./contract-values";
import { createCamera } from "./fake/camera";
import { createControl } from "./fake/control";
import { createDrawing } from "./fake/drawing";
import { createMapState } from "./fake/map-state";
import { type MountedMap, mountMap } from "./fake/mounted-map";
import { createProbe } from "./fake/probe";
import { createRouting } from "./fake/route";
import type { FakeAdapter, FakeAdapterOptions, FakeCall } from "./fake/types";
import { MAP_SIZE } from "./map-probe";
import { createRecorder } from "./recorder";

export type { FakeAdapter, FakeAdapterOptions, FakeCall } from "./fake/types";

/**
 * An in-memory map behind the adapter contract, composed from `fake/`: it records the store's
 * calls, draws into a map state its probe reads, and passes the conformance suite.
 */
export function createFakeAdapter(options: FakeAdapterOptions = {}): FakeAdapter {
  const recorder = createRecorder<FakeCall>();
  const control = createControl();
  const map = createMapState();
  const sizeOf = options.sizeOf;
  const camera = createCamera(() => (context && sizeOf ? sizeOf(context.container) : MAP_SIZE));
  const routing = createRouting();
  let context: MountContext | undefined;
  let mountedMap: MountedMap | undefined;
  let destroyed = false;
  const drawing = createDrawing(map, () => destroyed);
  const live = () => (destroyed ? undefined : mountedMap?.live());
  const probe = createProbe({ map, live, camera, routing });

  return {
    capabilities: new Set(options.capabilities ?? EVERY_CAPABILITY),
    routeStopLimit: options.routeStopLimit,
    calls: recorder.entries,
    get mounted() {
      return context;
    },
    get destroyed() {
      return destroyed;
    },
    mount(mountContext) {
      context = mountContext;
      mountedMap = mountMap(mountContext, map);
      return control.mounting;
    },
    apply(diff) {
      recorder.record({ method: "apply", diff });
      const drawn = drawing.apply(diff);
      return options.holdApplies ? Promise.all([drawn, control.held()]).then(() => {}) : drawn;
    },
    present(state) {
      recorder.record({ method: "present", state });
      drawing.present(state);
    },
    setView(view) {
      recorder.record({ method: "setView", view });
      camera.show(view);
    },
    setRoute(route) {
      recorder.record({ method: "setRoute", route });
      routing.set(route);
    },
    mountControl(node, position) {
      recorder.record({ method: "mountControl", position });
      mountedMap?.layer?.append(node);
      return () => node.remove?.();
    },
    destroy() {
      destroyed = true;
      map.entries.clear();
      mountedMap?.layer?.remove();
    },
    host() {
      if (context === undefined) throw new Error("not mounted yet");
      return context.host;
    },
    finishMount: control.finishMount,
    failMount: control.failMount,
    finishApplies: control.finishApplies,
    callsOf: recorder.entriesOf,
    probe: () => probe,
  };
}
