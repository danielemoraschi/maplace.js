/** Why a paste can't become a map, for the builder's status line. */
export class PasteRefused extends Error {
  override readonly name = "PasteRefused";
}

/** Something in a paste that wasn't carried over: `name`, then what `says` says of it. */
export interface Note {
  readonly name: string;
  readonly says: string;
}

/** `text` cut to a length a sentence can quote. */
export function shortened(text: string): string {
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

/** What a conversion leaves out, each name once. */
export interface Report {
  note(name: string, says: string): void;
  notes(): readonly Note[];
}

/** An empty report, keeping a name's first note. */
export function createReport(): Report {
  const says = new Map<string, string>();
  return {
    note(name, words) {
      if (!says.has(name)) says.set(name, words);
    },
    notes: () => [...says].map(([name, words]) => ({ name, says: words })),
  };
}
