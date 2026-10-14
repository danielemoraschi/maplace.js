import type { Location } from "../location";
import { changedIds, stateIn } from "../location-state";
import { type ListRender, setOptionContent, setOptionState } from "./option-node";
import type { Sections } from "./sections";
import type { ListState, StateChange } from "./variant";

/** What paints a listbox's options: the page's `render` and the current state. */
export interface PainterSources<Data> {
  readonly render: ListRender<Data> | undefined;
  readonly state: () => ListState;
}

/** Fills options with content and state, and repaints the few whose state changed. */
export interface OptionPainter<Data> {
  fill(option: HTMLElement, location: Location<Data>): void;
  repaintChanged(sections: Sections<Data, HTMLElement>, change: StateChange): void;
}

export function createOptionPainter<Data>({
  render,
  state,
}: PainterSources<Data>): OptionPainter<Data> {
  function fill(option: HTMLElement, location: Location<Data>): void {
    const itemState = stateIn(state(), location.id);
    setOptionContent(option, { entry: { location, ...itemState }, render });
    setOptionState(option, itemState);
  }

  return {
    fill,
    /** Re-renders content only where `render` can show the state; else attributes alone. */
    repaintChanged(sections, change) {
      for (const id of changedIds(change.previous, change.next)) {
        const option = sections.optionOf(id);
        const location = option && sections.locationOf(option);
        if (!option || !location) continue;
        if (render) fill(option, location);
        else setOptionState(option, stateIn(change.next, id));
      }
    },
  };
}
