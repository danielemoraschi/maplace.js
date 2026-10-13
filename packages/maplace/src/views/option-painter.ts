import type { Location, LocationState } from "../location";
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
      for (const id of changedIds(change)) {
        const option = sections.optionOf(id);
        const location = option && sections.locationOf(option);
        if (!option || !location) continue;
        if (render) fill(option, location);
        else setOptionState(option, stateIn(change.next, id));
      }
    },
  };
}

function stateIn(state: ListState, id: string): LocationState {
  return { selected: id === state.selectedId, hovered: id === state.hoveredId };
}

/** Each id whose selection or hover differs between the two states, once. */
function changedIds({ previous, next }: StateChange): Set<string> {
  const ids = new Set<string>();
  for (const id of [previous.selectedId, previous.hoveredId, next.selectedId, next.hoveredId]) {
    if (id === undefined) continue;
    const before = stateIn(previous, id);
    const after = stateIn(next, id);
    if (before.selected !== after.selected || before.hovered !== after.hovered) ids.add(id);
  }
  return ids;
}
