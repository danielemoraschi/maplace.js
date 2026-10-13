import type { ListActions } from "./actions";
import { labelOf } from "./model";
import { createSections } from "./sections";
import type { ListState, ListVariant } from "./variant";

const SELECT_CLASS = "maplace-select";

/** What a native select is made with: text only, so no `render`. */
export interface NativeSelectSettings {
  readonly label: string;
  readonly fitAllLabel: string | undefined;
}

/**
 * `as: 'select'`: a native `<select>`. It never hovers, and a state change only sets which option
 * is selected, so an open picker isn't rebuilt by hover traffic from the map.
 */
export function createNativeSelect<Data>(
  actions: ListActions,
  settings: NativeSelectSettings,
): ListVariant<Data> {
  const select = document.createElement("select");
  select.setAttribute("aria-label", settings.label);
  select.className = SELECT_CLASS;
  // Shown while nothing is selected, so "fit all" stays a choice that fires `change` again.
  const placeholder = textOption(settings.fitAllLabel ?? "");
  placeholder.hidden = true;
  const fitAll = settings.fitAllLabel === undefined ? undefined : textOption(settings.fitAllLabel);
  const fixed = fitAll ? [placeholder, fitAll] : [placeholder];
  const sections = createSections<Data, HTMLOptionElement>(select, {
    option: () => textOption(""),
    fill: (option, location) => {
      option.textContent = labelOf(location);
    },
    group: (heading) => {
      const group = document.createElement("optgroup");
      group.label = heading;
      return { element: group, head: [] };
    },
  });
  let selectedId: string | undefined;

  function onChange(): void {
    // `options[selectedIndex]`, not `selectedOptions`, which some DOMs don't keep current.
    const chosen = select.options[select.selectedIndex];
    const location = chosen && sections.locationOf(chosen);
    if (location) actions.choose(location.id);
    else if (chosen === fitAll) actions.showAll();
    // Back to what the store holds: "fit all" with nothing selected changes no state.
    showSelection();
  }
  select.addEventListener("change", onChange);

  function showSelection(): void {
    const wanted =
      (selectedId === undefined ? undefined : sections.optionOf(selectedId)) ?? placeholder;
    if (!wanted.selected) wanted.selected = true;
  }

  return {
    element: select,
    renderStructure(structure) {
      const listed = sections.render(structure, fixed);
      select.hidden = listed.length === 0 && fitAll === undefined;
      showSelection();
    },
    renderState(state: ListState) {
      selectedId = state.selectedId;
      showSelection();
    },
    destroy() {
      select.removeEventListener("change", onChange);
      select.remove();
    },
  };
}

function textOption(text: string): HTMLOptionElement {
  const option = document.createElement("option");
  option.textContent = text;
  return option;
}
