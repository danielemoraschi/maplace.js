import { act, Component, Fragment, type ReactNode, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { onTestFinished } from "vitest";
import type { Maplace } from "../../index";
import { useMaplace } from "../maplace-provider";

// Tells React its updates are wrapped in `act`, so it flushes them there and warns otherwise.
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

/** How a test renders: inside `<StrictMode>`, which runs effects twice, or not. */
export const ROOT_MODES = [
  { mode: "a plain root", Wrapper: Fragment },
  { mode: "StrictMode", Wrapper: StrictMode },
] as const;

export type RootMode = (typeof ROOT_MODES)[number];

export interface Rendered {
  readonly container: HTMLElement;
  /** What the error boundary around the rendered tree caught. */
  readonly errors: readonly unknown[];
  render(ui: ReactNode): Promise<void>;
  unmount(): Promise<void>;
}

/** Renders `ui` into a root on the page, unmounted when the test finishes. */
export async function renderInto(
  ui: ReactNode,
  { Wrapper }: RootMode = ROOT_MODES[0],
): Promise<Rendered> {
  const container = document.createElement("div");
  document.body.append(container);
  const errors: unknown[] = [];
  const record = (error: unknown) => errors.push(error);
  const root = createRoot(container, { onCaughtError: record });
  let mounted = true;
  const rendered: Rendered = {
    container,
    errors,
    render: (next) =>
      act(async () =>
        root.render(
          <Wrapper>
            <Boundary>{next}</Boundary>
          </Wrapper>,
        ),
      ),
    async unmount() {
      if (mounted) await act(async () => root.unmount());
      mounted = false;
      container.remove();
    },
  };
  onTestFinished(() => rendered.unmount());
  await rendered.render(ui);
  return rendered;
}

/** Renders nothing once a child throws, as an app's boundary would; the root reports the error. */
export class Boundary extends Component<
  { readonly children: ReactNode },
  { readonly failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Runs `change` and lets React render what it caused, as a user's input would. */
export function inAct(change: () => void | Promise<void>): Promise<void> {
  return act(async () => {
    await change();
  });
}

/** A component that keeps the store of the provider it is rendered in, for a test to read. */
export function storeCatcher(): { readonly Keep: () => null; store(): Maplace } {
  let caught: Maplace | undefined;
  return {
    Keep() {
      caught = useMaplace();
      return null;
    },
    store() {
      if (caught === undefined) throw new Error("no store caught: render <Keep /> in a provider");
      return caught;
    },
  };
}
