import { createListView, type ListView, type Maplace } from "../index";
import { elementMisuse, runPageCode } from "./element-error";
import type { ListViewFactory, ListViewSetup } from "./index";
import { createRegistry } from "./registry";

const LIST_FIELD = { field: "list" };

/** `list=""` is the listbox, `list="select"` the native select: both built in, never redefined. */
const BUILT_IN = new Map<string, ListViewFactory>([
  ["", (maplace, { options }) => createListView(maplace, options)],
  ["select", (maplace, { options }) => createListView(maplace, { ...options, as: "select" })],
]);

const defined = createRegistry<ListViewFactory>({
  noun: "list view",
  builds: "a list view",
  ...LIST_FIELD,
});

/**
 * Registers a list view for `<maplace-map list="<name>">`. Throws for a built-in name, or one
 * already given to another factory.
 */
export function defineListView(name: string, factory: ListViewFactory): void {
  if (BUILT_IN.has(name)) throw elementMisuse(`list view "${name}" is built in`, LIST_FIELD);
  defined.add(name, factory);
}

/** Calls `callback` whenever a list view is defined, until the returned function is called. */
export const onListViewDefined = defined.onAdded;

/** Whether `list="<name>"` gives a view now, built in or defined. */
export function namesListView(name: string): boolean {
  return BUILT_IN.has(name) || defined.get(name) !== undefined;
}

/**
 * The view `name` gives, built for `maplace`. An unknown name, a failure of the view's own, or
 * anything but a `ListView` is the element's misuse.
 */
export function buildListView(name: string, maplace: Maplace, setup: ListViewSetup): ListView {
  const factory = factoryNamed(name);
  const view: unknown = runPageCode(
    () => factory(maplace, setup),
    `list view "${name}" failed to build`,
    LIST_FIELD,
  );
  if (!isListView(view)) {
    destroyRefused(view);
    throw elementMisuse(
      `list view "${name}" must return a ListView: { element, destroy }`,
      LIST_FIELD,
    );
  }
  return {
    element: view.element,
    destroy: () =>
      runPageCode(() => view.destroy(), `list view "${name}" failed to destroy`, LIST_FIELD),
  };
}

function factoryNamed(name: string): ListViewFactory {
  const factory = BUILT_IN.get(name) ?? defined.get(name);
  if (factory !== undefined) return factory;
  // The names defined aren't listed: the message must stay the same as other views are defined.
  throw elementMisuse(
    `list "${name}" names no list view: leave list empty for a list, "select" for a native ` +
      `select, or define "${name}" with defineListView`,
    LIST_FIELD,
  );
}

/** Takes down what a refused view built, when it gives a `destroy`, so it follows the store no more. */
function destroyRefused(view: unknown): void {
  const destroy = (view as { destroy?: unknown } | null | undefined)?.destroy;
  try {
    if (typeof destroy === "function") destroy.call(view);
  } catch {
    // The refusal is what the page needs to hear, not how the refused view failed to come down.
  }
}

function isListView(value: unknown): value is ListView {
  if (typeof value !== "object" || value === null) return false;
  const { element, destroy } = value as Partial<Record<keyof ListView, unknown>>;
  return (
    (element as Node | undefined)?.nodeType === Node.ELEMENT_NODE && typeof destroy === "function"
  );
}
