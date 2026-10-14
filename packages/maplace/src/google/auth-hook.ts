/** The global function Google calls when it refuses the page's key. */
const HOOK = "gm_authFailure";

type Handler = () => void;

/** Google refusing the page's key, as listeners hear it. */
export interface AuthHook {
  /** Whether Google has refused the key already: it says so once per page. */
  refused(): boolean;
  /** Calls `listener` when Google refuses the key; returns a function that stops it. */
  listen(listener: Handler): () => void;
}

/**
 * Takes over `gm_authFailure` on `page`, keeping every handler the page (or another copy of
 * maplace) set there, before or after, and running each once per refusal. Measured on Maps JS
 * 3.66: Google checks the key once per page, as the first map opens, so the refusal is
 * remembered for maps that open later.
 */
export function createAuthHook(page: object): AuthHook {
  const listeners = new Set<Handler>();
  let refused = false;

  function onRefused(): void {
    // Once per page; and a page's handler may wrap the one it found there, this one.
    if (refused) return;
    refused = true;
    // The page's handlers fail as they would without maplace; the maps still hear of it.
    try {
      runPageHandlers();
    } finally {
      for (const listener of listeners) listener();
    }
  }

  const runPageHandlers = takeOver(page, onRefused);
  return {
    refused: () => refused,
    listen(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * Puts `onRefused` where Google calls it, and gives back what the page had there and sets later.
 * An accessor keeps a handler set later from replacing it; a function the page declared globally
 * can't be redefined, so it is wrapped instead, and a later assignment there wins.
 */
function takeOver(page: object, onRefused: Handler): Handler {
  const earlier: unknown = Reflect.get(page, HOOK);
  let later: unknown;
  if (Object.getOwnPropertyDescriptor(page, HOOK)?.configurable === false) {
    Reflect.set(page, HOOK, onRefused);
  } else {
    Object.defineProperty(page, HOOK, {
      get: () => onRefused,
      set: (handler: unknown) => {
        later = handler;
      },
      configurable: true,
    });
  }
  return () => {
    for (const handler of [earlier, later]) if (typeof handler === "function") handler();
  };
}
