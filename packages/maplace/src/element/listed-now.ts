import type { Location, Maplace } from "../index";
import { listStructureOf } from "../views/model";

/** What maplace's list views list for `maplace` now: their one rule, in data order. */
export function listedNow(maplace: Maplace): readonly Location[] {
  const { sections } = listStructureOf(maplace.getSnapshot(), { groupHeadings: false });
  return sections[0]?.locations ?? [];
}
