import type { Location } from "maplace";

/** What `save(location)` is given: a location, of any type. */
type SavedLocation = Pick<Location, "id" | "title"> & { readonly path?: readonly unknown[] };

/**
 * The `save` the `polygon` page calls with each edit, which a reader writes for their own
 * backend: on the site, it says what was saved in the `[data-saved]` note of the one page that
 * calls it (`example-sections.test.ts` holds that to one).
 */
export function provideSave(page: object, document: Document): void {
  Object.assign(page, {
    save(location: SavedLocation): void {
      const note = document.querySelector<HTMLElement>("[data-saved]");
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
