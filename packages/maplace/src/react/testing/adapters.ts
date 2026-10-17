import { createFakeAdapter, type FakeAdapter } from "../../testing/fake-adapter";

/** A `createAdapter` prop making fake adapters, and the adapters it made. */
export interface FakeAdapters {
  readonly createAdapter: () => FakeAdapter;
  readonly made: readonly FakeAdapter[];
  /** The one adapter attached now: StrictMode makes one and destroys it first. */
  live(): FakeAdapter;
}

export function fakeAdapters(): FakeAdapters {
  const made: FakeAdapter[] = [];
  return {
    createAdapter() {
      const adapter = createFakeAdapter();
      made.push(adapter);
      return adapter;
    },
    made,
    live() {
      const live = made.filter((adapter) => !adapter.destroyed);
      if (live.length !== 1) throw new Error(`${live.length} live adapters, expected 1`);
      return live[0] as FakeAdapter;
    },
  };
}
