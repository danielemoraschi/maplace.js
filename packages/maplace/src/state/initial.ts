import type { Location } from "../location";
import type { MaplaceOptions } from "../options";
import type { Snapshot } from "../store";
import { child, type Field, root } from "../validate/fail";
import { validateOptions } from "../validate/options";
import type { View } from "../viewport";
import { checkKnownId, checkSelectable } from "./checks";
import { frozenList } from "./lookup";
import { copyView, fitAllView, locationView } from "./views";

/**
 * The first snapshot. The view is `options.view` when given, else the selected location, else
 * all locations fitted (RFC §3).
 */
export function initialSnapshot<Data>(options: MaplaceOptions<Data> | undefined): Snapshot<Data> {
  validateOptions(options);
  const locations = frozenList(options?.locations ?? []);
  checkInitialIds(locations, options);
  return Object.freeze({
    locations,
    selectedId: options?.selectedId,
    hoveredId: undefined,
    filter: undefined,
    view: initialView(options),
    viewport: undefined,
    route: undefined,
    routeResult: undefined,
    loadState: "idle",
  });
}

/** `selectedId` must name a shown location, and a `location` view a known one. */
function checkInitialIds<Data>(
  locations: readonly Location<Data>[],
  options: MaplaceOptions<Data> | undefined,
): void {
  const selectedId = options?.selectedId;
  if (selectedId !== undefined) {
    checkSelectable(
      { locations, filter: undefined },
      selectedId,
      optionField("selectedId", selectedId),
    );
  }
  const view = options?.view;
  if (view?.kind === "location") {
    checkKnownId(locations, view.id, child(optionField("view", view.id), "id"));
  }
}

function initialView(options: MaplaceOptions<unknown> | undefined): View {
  if (options?.view !== undefined) return copyView(options.view);
  const selectedId = options?.selectedId;
  return selectedId === undefined ? fitAllView() : locationView(selectedId, undefined);
}

function optionField(name: string, locationId: string): Field {
  return child(child(root("createMaplace", locationId), "options"), name);
}
