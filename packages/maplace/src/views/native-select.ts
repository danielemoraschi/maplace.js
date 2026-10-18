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
  // What shows while nothing is selected: "fit all" itself, or a blank placeholder without one;
  // none shows while a location it leaves out is, so choosing "fit all" then fires change.
  // No hidden placeholder beside "fit all": Safari lists hidden options, so it would show twice.
  const fitAll = settings.fitAllLabel === undefined ? undefined : textOption(settings.fitAllLabel);
  const nothingSelected = fitAll ?? blankPlaceholder();
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

  /** The store's selection: "fit all" (or the placeholder) for none, no option if unlisted. */
  function showSelection(): void {
    const option = selectedId === undefined ? nothingSelected : sections.optionOf(selectedId);
    if (option === undefined) showNoOption();
    else if (!option.selected) option.selected = true;
  }

  function showNoOption(): void {
    if (select.selectedIndex !== -1) select.selectedIndex = -1;
  }

  return {
    element: select,
    renderStructure(structure) {
      const listed = sections.render(structure, [nothingSelected]);
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

/** Shown while nothing is selected, kept out of the picker where browsers allow. */
function blankPlaceholder(): HTMLOptionElement {
  const placeholder = textOption("");
  placeholder.hidden = true;
  return placeholder;
}

function textOption(text: string): HTMLOptionElement {
  const option = document.createElement("option");
  option.textContent = text;
  return option;
}
