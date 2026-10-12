import type {
  Adapter,
  AdapterHost,
  Capability,
  LocationDiff,
  MountContext,
  PresentationState,
} from "../adapter";
import type { Route } from "../route";
import type { ResolvedView } from "../viewport";

const EVERY_CAPABILITY: readonly Capability[] = ["route", "cluster", "circle", "edit"];

export interface FakeAdapterOptions {
  /** Default: every capability. */
  readonly capabilities?: readonly Capability[];
  readonly routeStopLimit?: number;
  /** Hold each `apply` until `finishApplies()`; by default it resolves at once. */
  readonly holdApplies?: boolean;
}

/** One call the store made, in order. */
export type FakeCall =
  | { readonly method: "apply"; readonly diff: LocationDiff }
  | { readonly method: "present"; readonly state: PresentationState }
  | { readonly method: "setView"; readonly view: ResolvedView }
  | { readonly method: "setRoute"; readonly route: Route | undefined };

/**
 * An in-memory adapter that records what the store asks of it. Mounting waits for the test
 * (`finishMount`, `failMount`), so tests see every load state.
 */
export interface FakeAdapter extends Adapter {
  readonly calls: readonly FakeCall[];
  readonly mounted: MountContext | undefined;
  readonly destroyed: boolean;
  /** The host from `mount`; throws before it. */
  host(): AdapterHost;
  finishMount(): Promise<void>;
  failMount(error: unknown): Promise<void>;
  finishApplies(): Promise<void>;
  /** The calls of one method, as their arguments. */
  callsOf<M extends FakeCall["method"]>(method: M): Extract<FakeCall, { method: M }>[];
}

export function createFakeAdapter(options: FakeAdapterOptions = {}): FakeAdapter {
  const calls: FakeCall[] = [];
  const heldApplies: (() => void)[] = [];
  let finishMount: () => void = () => {};
  let failMount: (error: unknown) => void = () => {};
  const mounting = new Promise<void>((resolve, reject) => {
    finishMount = resolve;
    failMount = reject;
  });
  let mounted: MountContext | undefined;
  let destroyed = false;

  return {
    capabilities: new Set(options.capabilities ?? EVERY_CAPABILITY),
    routeStopLimit: options.routeStopLimit,
    calls,
    get mounted() {
      return mounted;
    },
    get destroyed() {
      return destroyed;
    },
    mount(context) {
      mounted = context;
      return mounting;
    },
    apply(diff) {
      calls.push({ method: "apply", diff });
      if (!options.holdApplies) return Promise.resolve();
      return new Promise((resolve) => heldApplies.push(resolve));
    },
    present: (state) => calls.push({ method: "present", state }),
    setView: (view) => calls.push({ method: "setView", view }),
    setRoute: (route) => calls.push({ method: "setRoute", route }),
    mountControl: () => () => {},
    destroy() {
      destroyed = true;
    },
    host() {
      if (mounted === undefined) throw new Error("not mounted yet");
      return mounted.host;
    },
    finishMount: () => settle(finishMount),
    failMount: (error) => settle(() => failMount(error)),
    finishApplies: () =>
      settle(() => {
        for (const resolve of heldApplies.splice(0)) resolve();
      }),
    callsOf<M extends FakeCall["method"]>(method: M) {
      return calls.filter(
        (call): call is Extract<FakeCall, { method: M }> => call.method === method,
      );
    },
  };
}

/** Runs `action`, then lets the promise callbacks it triggered run. */
async function settle(action: () => void): Promise<void> {
  action();
  await new Promise((resolve) => setTimeout(resolve, 0));
}
