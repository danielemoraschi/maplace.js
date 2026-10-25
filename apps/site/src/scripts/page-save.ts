import type { Location } from "maplace";
import { SHOWN_NOTES } from "./version-notes.ts";

/** What `save(location)` is given: a location, of any type. */
type SavedLocation = Pick<Location, "id" | "title"> & { readonly path?: readonly unknown[] };

/**
 * The `save` every `polygon` version calls with each edit, which a reader writes for their own
 * backend: on the site, it says what was saved in the shown version's `[data-saved]` note, the one
 * a visitor can edit, in the one section whose versions save (`example-sections.test.ts`). Each
 * version keeps its own last save, shown again with it.
 */
export function provideSave(pageGlobals: object, document: Document): void {
  Object.assign(pageGlobals, {
    save(location: SavedLocation): void {
      const note = document.querySelector<HTMLElement>(`${SHOWN_NOTES} [data-saved]`);
      if (note === null) return;
      note.textContent = `Saved: ${savedName(location)}.`;
      note.hidden = false;
    },
  });
}

/** `Park, 3 points`, or the id of a location without a title. */
function savedName({ id, title, path }: SavedLocation): string {
  const name = title ?? id;
  return path === undefined ? name : `${name}, ${path.length} points`;
}
