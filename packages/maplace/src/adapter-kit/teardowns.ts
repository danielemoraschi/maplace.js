/** What each part of an open map added, to take off when the map closes. */
export interface Teardowns {
  /** Runs `teardown` when the map closes, before those added earlier. */
  add(teardown: () => void): void;
  /** Whether they have run. */
  done(): boolean;
  /** Runs each through `run`, the last added first, once: later calls do nothing. */
  runAll(run?: (teardown: () => void) => void): void;
}

export function createTeardowns(): Teardowns {
  const teardowns: (() => void)[] = [];
  let done = false;
  return {
    add: (teardown) => teardowns.push(teardown),
    done: () => done,
    runAll(run = (teardown) => teardown()) {
      if (done) return;
      done = true;
      for (const teardown of teardowns.splice(0).reverse()) run(teardown);
    },
  };
}
