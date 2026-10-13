/** Something recorded, named by `method`. */
export interface Recorded {
  readonly method: string;
}

/** Records entries in order; tests read them all, or those of one method. */
export interface Recorder<Entry extends Recorded> {
  readonly entries: readonly Entry[];
  record(entry: Entry): void;
  entriesOf<M extends Entry["method"]>(method: M): Extract<Entry, { method: M }>[];
}

export function createRecorder<Entry extends Recorded>(): Recorder<Entry> {
  const entries: Entry[] = [];
  return {
    entries,
    record: (entry) => entries.push(entry),
    entriesOf<M extends Entry["method"]>(method: M) {
      return entries.filter(
        (entry): entry is Extract<Entry, { method: M }> => entry.method === method,
      );
    },
  };
}
