import { element } from "./listbox-nodes";
import type { AreaMode } from "./viewport-scope";

export const AREA_SWITCH_CLASS = "maplace-area-switch";
export const SHOW_ALL_CLASS = "maplace-show-all";
export const AREA_ONLY_CLASS = "maplace-area-only";
export const EMPTY_AREA_CLASS = "maplace-empty-area";

/** What a list with `scope` shows above its entries: its switch's name and labels, its status's. */
export interface AreaSwitchLabels {
  /** The switch's accessible name: the list's. */
  readonly name: string;
  readonly showAll: string;
  readonly areaOnly: string;
  readonly emptyArea: string;
}

/** The switch a list with `scope` is put in "All" or "This area" from. */
export interface AreaSwitch {
  /** Calls `choose` with the mode of each button pressed; returns what stops it. */
  onChoose(choose: (mode: AreaMode) => void): () => void;
  /** Says in the status, or stops saying, that the area holds no location. */
  showEmptyArea(empty: boolean): void;
}

/** An area switch, its group of two buttons, and the status it speaks in. */
export interface AreaSwitchParts extends AreaSwitch {
  readonly group: HTMLElement;
  readonly status: HTMLElement;
  /** Puts focus on the button pressed. */
  focusPressed(): void;
}

/**
 * "All" and "This area", two toggle buttons in a group named as the list, "All" pressed until
 * the other is; and the empty-area status, always on the page and empty but over an empty area,
 * so a screen reader hears its text arrive.
 */
export function createAreaSwitch(labels: AreaSwitchLabels): AreaSwitchParts {
  const buttons = new Map<AreaMode, HTMLButtonElement>([
    ["all", toggleButton(SHOW_ALL_CLASS, labels.showAll)],
    ["area", toggleButton(AREA_ONLY_CLASS, labels.areaOnly)],
  ]);
  let pressed: AreaMode = "all";
  const press = (chosen: AreaMode) => {
    pressed = chosen;
    for (const [mode, button] of buttons) {
      button.setAttribute("aria-pressed", String(mode === chosen));
    }
  };
  press(pressed);
  const group = element("div", AREA_SWITCH_CLASS);
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", labels.name);
  group.append(...buttons.values());
  const status = element("div", EMPTY_AREA_CLASS);
  status.setAttribute("role", "status");
  return {
    group,
    status,
    onChoose(choose) {
      const listening = new AbortController();
      for (const [mode, button] of buttons) {
        const chooseMode = () => {
          choose(mode);
          press(mode);
        };
        button.addEventListener("click", chooseMode, { signal: listening.signal });
      }
      return () => listening.abort();
    },
    focusPressed() {
      buttons.get(pressed)?.focus({ preventScroll: true });
    },
    showEmptyArea(empty) {
      const said = empty ? labels.emptyArea : "";
      if (status.textContent !== said) status.textContent = said;
    },
  };
}

function toggleButton(className: string, label: string): HTMLButtonElement {
  const node = element("button", className) as HTMLButtonElement;
  node.type = "button";
  node.textContent = label;
  return node;
}
