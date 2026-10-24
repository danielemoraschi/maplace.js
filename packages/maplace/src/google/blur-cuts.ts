import type { MountedMap } from "./mounted-map";

/** What gives a location back its editing, once the press a blur cut short has ended. */
export type GiveBack = () => void;

/**
 * A location's answer to a blur while a press on the map is held: its drag cut short, and what
 * gives its editing back; nothing when it isn't editable.
 */
type BlurCut = () => GiveBack | undefined;

/** Each open map's cuts, watched from the first location placed on it. */
const cutsOf = new WeakMap<MountedMap, Set<BlurCut>>();

/**
 * Runs `cut` each time the window loses focus while a press on the map is held: Google goes on
 * with a marker's or a handle's drag after a blur until the next release, wherever and whenever
 * it comes (measured on real Maps, M27). Returns what stops it, for a location taken off.
 */
export function cutOnBlur(mounted: MountedMap, cut: BlurCut): () => void {
  const cuts = cutsOf.get(mounted) ?? watchBlurs(mounted);
  cuts.add(cut);
  return () => cuts.delete(cut);
}

/**
 * Takes an editable location's editing away, returning what gives it back as `isEditable` says
 * then; nothing for one that isn't editable. Google drops a drag under way when its marker or
 * shape stops being editable, and fires nothing more of it while editing stays off through the
 * release (measured, M27).
 */
export function takeEditingAway(
  setEditing: (on: boolean) => void,
  isEditable: () => boolean,
): GiveBack | undefined {
  if (!isEditable()) return undefined;
  setEditing(false);
  return () => setEditing(isEditable());
}

/**
 * The map's cuts, kept for it and run on a window blur while a press on its element is held,
 * until it closes. Editing comes back a frame after the press ends: maplace hears the release on
 * the window before Google does, so given back at once, Google would see it on at the release.
 * When the window never hears the release (let go in another app), it comes back a frame into
 * the next press, which Google then takes for no drag.
 */
function watchBlurs(mounted: MountedMap): Set<BlurCut> {
  const cuts = new Set<BlurCut>();
  cutsOf.set(mounted, cuts);
  const element = mounted.map.getDiv();
  // A map's element is in a document with a window.
  const view = element.ownerDocument.defaultView as Window;
  const listening = new AbortController();
  mounted.onDestroy(() => {
    listening.abort();
    cuts.clear();
  });
  const options = { capture: true, signal: listening.signal };
  let held = false;
  let givingBack: GiveBack[] = [];

  const giveBack = () => {
    const due = givingBack;
    givingBack = [];
    if (due.length === 0) return;
    requestAnimationFrame(() => {
      if (!listening.signal.aborted) for (const back of due) back();
    });
  };
  const pressEnded = () => {
    held = false;
    giveBack();
  };

  // The main button, or a finger: another button's release may go to a menu the page never sees.
  element.addEventListener(
    "pointerdown",
    (event) => {
      held = !event.button;
    },
    options,
  );
  view.addEventListener("pointerup", pressEnded, options);
  view.addEventListener("pointercancel", pressEnded, options);
  view.addEventListener("pointerdown", giveBack, options);
  // An element's own blur doesn't bubble: only the window's says the page lost the focus.
  view.addEventListener(
    "blur",
    () => {
      if (!held) return;
      held = false;
      givingBack.push(...cutAll(cuts));
    },
    { signal: listening.signal },
  );
  return cuts;
}

/**
 * Runs the cuts there are at the blur, each while still there: a report's listener may add or
 * take off locations, or close the map. Returns what gives their editing back.
 */
function cutAll(cuts: Set<BlurCut>): GiveBack[] {
  const givingBack: GiveBack[] = [];
  // A snapshot: a set iterated as it changes would run cuts added meanwhile.
  for (const cut of Array.from(cuts)) {
    const back = cuts.has(cut) ? cut() : undefined;
    if (back) givingBack.push(back);
  }
  return givingBack;
}
