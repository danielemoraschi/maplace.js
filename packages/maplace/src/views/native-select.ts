import type { ListActions } from "./actions";
import { labelOf } from "./model";
import { createSections } from "./sections";
import type { ListState, ListVariant } from "./variant";

export const SELECT_CLASS = "maplace-select";

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
  // What shows while nothing is selected: "fit all" itself while the view is that fit, or a blank
  // placeholder without one; none shows while the map is elsewhere or a location it leaves out is
  // selected, as a select fires no change for the option it shows, so "fit all" could not be chosen.
  // No hidden placeholder beside "fit all": Safari lists hidden options, so it would show twice.
  const fitAll = settings.fitAllLabel === undefined ? undefined : textOption(settings.fitAllLabel);
  const nothingSelected = fitAll ?? blankPlaceholder();
  const sections = createSections<Data, HTMLOptionElement>(select, {
    option: () => textOption(""),
    fill: (option, location, distance) => {
      option.textContent = distance
        ? `${labelOf(location)} (${distance.label})`
        : labelOf(location);
    },
    group: () => {
      const group = document.createElement("optgroup");
      return {
        element: group,
        head: [],
        name(text) {
          group.label = text;
        },
      };
    },
  });
  let selectedId: string | undefined;
  let viewFitsAll = true;

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

  function optionToShow(): HTMLOptionElement | undefined {
    if (selectedId !== undefined) return sections.optionOf(selectedId);
    return fitAll === undefined || viewFitsAll ? nothingSelected : undefined;
  }

  function showSelection(): void {
    const index = optionToShow()?.index ?? -1;
    if (select.selectedIndex !== index) select.selectedIndex = index;
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
    renderView(view) {
      viewFitsAll = view.kind === "fit-all";
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
