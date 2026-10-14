import { nextTask } from "../../adapter-kit/chunks";

/**
 * What tests hold back on the fake: its mount until `finishMount`/`failMount`, and, with
 * `holdApplies`, each `apply` until `finishApplies`. Each step then lets the promise callbacks it
 * triggered run, so the test sees their effect.
 */
export interface FakeControl {
  readonly mounting: Promise<void>;
  /** Resolves when the test releases held applies. */
  held(): Promise<void>;
  finishMount(): Promise<void>;
  failMount(error: unknown): Promise<void>;
  finishApplies(): Promise<void>;
}

export function createControl(): FakeControl {
  const heldApplies: (() => void)[] = [];
  let finishMount: () => void = () => {};
  let failMount: (error: unknown) => void = () => {};
  const mounting = new Promise<void>((resolve, reject) => {
    finishMount = resolve;
    failMount = reject;
  });
  return {
    mounting,
    held: () => new Promise((resolve) => heldApplies.push(resolve)),
    finishMount: () => settle(finishMount),
    failMount: (error) => settle(() => failMount(error)),
    finishApplies: () =>
      settle(() => {
        for (const resolve of heldApplies.splice(0)) resolve();
      }),
  };
}

/** Runs `action`, then lets the promise callbacks it triggered run. */
async function settle(action: () => void): Promise<void> {
  action();
  await nextTask();
}
