/**
 * How many WebGL contexts maplace's maps may hold before hidden ones give theirs back: half the
 * browser's 16 or so, leaving room for the page's own (WebGL maps, canvases, video).
 */
const PAGE_LIVE_CONTEXTS = 8;

/** A watched map's context, as the budget sees it. */
export interface ContextHolder {
  /** Whether the map holds its context now, or is taking it back. */
  holdsContext(): boolean;
  /** Gives the context back, the map being hidden. */
  giveBack(): void;
}

/**
 * The contexts the page's maps hold, past which the map hidden longest gives its context back:
 * a map hidden for a moment (a closed tab, another example on show) keeps its context while the
 * page has room, so it shows again without drawing from scratch. A map on show never gives its
 * context back here.
 */
export interface ContextBudget {
  /** `holder` is a map watched: its context counts. */
  watch(holder: ContextHolder): void;
  /** `holder`'s map is hidden: its context may be given back, after those hidden before it. */
  hidden(holder: ContextHolder): void;
  /** `holder`'s map shows: its context counts, and is never given back while it shows. */
  shown(holder: ContextHolder): void;
  /** `holder`'s map is gone: its context counts no more. */
  forget(holder: ContextHolder): void;
}

/** A budget of `limit` live contexts. */
export function contextBudget(limit: number): ContextBudget {
  const watched = new Set<ContextHolder>();
  const hiddenLongestFirst = new Set<ContextHolder>();

  const liveContexts = () => [...watched].filter((holder) => holder.holdsContext()).length;
  const keepWithinLimit = () => {
    let live = liveContexts();
    for (const holder of hiddenLongestFirst) {
      if (live <= limit) return;
      if (!holder.holdsContext()) continue;
      hiddenLongestFirst.delete(holder);
      holder.giveBack();
      live -= 1;
    }
  };

  return {
    watch(holder) {
      watched.add(holder);
      keepWithinLimit();
    },
    hidden(holder) {
      if (!watched.has(holder)) return;
      hiddenLongestFirst.add(holder);
      keepWithinLimit();
    },
    shown(holder) {
      hiddenLongestFirst.delete(holder);
      keepWithinLimit();
    },
    forget(holder) {
      watched.delete(holder);
      hiddenLongestFirst.delete(holder);
    },
  };
}

const PAGE_BUDGET_KEY = Symbol.for("maplace.contextBudget");

/**
 * The page's budget, shared by every map maplace creates on it, whichever copy of maplace made
 * the map: each CDN script carries its own, and two budgets would let the page's maps hold twice
 * the contexts.
 */
export const PAGE_CONTEXT_BUDGET: ContextBudget = pageBudget();

function pageBudget(): ContextBudget {
  const page = globalThis as { [PAGE_BUDGET_KEY]?: ContextBudget };
  page[PAGE_BUDGET_KEY] ??= contextBudget(PAGE_LIVE_CONTEXTS);
  return page[PAGE_BUDGET_KEY];
}
