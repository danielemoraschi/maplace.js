import type { ListActions } from "./actions";
import { createHoverIntent } from "./hover-intent";
import { heldFocus, keepFocus } from "./kept-focus";
import { listenToListbox } from "./listbox-events";
import { applyHover } from "./listbox-hover";
import {
  fitAllElement,
  groupElement,
  listboxElement,
  optionAt,
  optionElement,
} from "./listbox-nodes";
import type { ListRender } from "./option-node";
import { setOptionState } from "./option-node";
import { createOptionPainter } from "./option-painter";
import { createRoving } from "./roving";
import { scrollOptionIntoList } from "./scroll";
import { createSections } from "./sections";
import type { ListState, ListVariant } from "./variant";

/** What a listbox is made with. */
export interface ListboxSettings<Data> {
  readonly label: string;
  readonly fitAllLabel: string | undefined;
  readonly render: ListRender<Data> | undefined;
}

/** `as: 'list'`: an accessible listbox kept in step with the store. */
export function createListbox<Data>(
  actions: ListActions,
  settings: ListboxSettings<Data>,
): ListVariant<Data> {
  const listbox = listboxElement(settings.label);
  const fitAll =
    settings.fitAllLabel === undefined ? undefined : fitAllElement(settings.fitAllLabel);
  const fixed = fitAll ? [fitAll] : [];
  const roving = createRoving();
  const intent = createHoverIntent();
  let state: ListState = { selectedId: undefined, hoveredId: undefined };
  // The focus order, rebuilt once per structure change, never per hover.
  let ordered: readonly HTMLElement[] = fixed;
  const painter = createOptionPainter({ render: settings.render, state: () => state });
  const sections = createSections<Data, HTMLElement>(listbox, {
    option: optionElement,
    fill: painter.fill,
    group: groupElement,
  });
  const stopListening = listenToListbox(listbox, {
    actions,
    intent,
    roving,
    optionAt: (target) => optionAt({ listbox, fitAll, sections }, target),
    idOf: (option) => sections.locationOf(option)?.id,
    order: () => ordered,
  });

  function selectedOption(): HTMLElement | undefined {
    return state.selectedId === undefined ? undefined : sections.optionOf(state.selectedId);
  }

  function placeTabStop(): void {
    roving.stopAt(selectedOption() ?? ordered[0]);
  }

  return {
    element: listbox,
    renderStructure(structure) {
      const held = heldFocus(listbox, ordered);
      ordered = [...fixed, ...sections.render(structure, fixed)];
      const hover = intent.retain((id) => sections.optionOf(id) !== undefined);
      applyHover(actions, hover);
      listbox.hidden = ordered.length === 0;
      placeTabStop();
      keepFocus(roving, { held, order: ordered });
    },
    renderState(next) {
      const previous = state;
      state = next;
      painter.repaintChanged(sections, { previous, next });
      if (next.selectedId === previous.selectedId) return;
      if (fitAll)
        setOptionState(fitAll, { selected: next.selectedId === undefined, hovered: false });
      placeTabStop();
      const selected = selectedOption();
      if (selected) scrollOptionIntoList(listbox, selected);
    },
    destroy() {
      stopListening();
      const own = intent.current();
      if (own !== undefined) actions.unhover(own);
      listbox.remove();
    },
  };
}
