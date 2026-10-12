import type { MaplaceOptions } from "../options";
import { child, root } from "./fail";
import { validateLocations } from "./locations";
import { OLD_OPTIONS } from "./migration";
import { checkPopupOptions } from "./popup";
import { type Assert, recordOf } from "./record";
import { checkShapeStyle } from "./style";
import { checkBoolean, checkFunction, checkNonEmptyString, optional } from "./values";
import { checkView } from "./viewport";

const checkOptionFields: Assert<MaplaceOptions> = recordOf<MaplaceOptions, "locations">({
  checks: {
    selectedId: optional(checkNonEmptyString),
    sanitize: optional(checkFunction),
    popup: optional(checkPopupOptions),
    style: optional(checkShapeStyle),
    cluster: optional(checkBoolean),
    view: optional(checkView),
  },
  unchecked: ["locations"],
  unknown: "is not a maplace option",
  remarks: OLD_OPTIONS,
});

/** `createMaplace` options; whether `selectedId` names a location is the store's check. */
export function validateOptions(value: unknown): asserts value is MaplaceOptions | undefined {
  if (value === undefined) return;
  checkOptionFields(value, child(root("createMaplace"), "options"));
  if (value.locations !== undefined) {
    validateLocations(value.locations, { caller: "createMaplace", sanitize: value.sanitize });
  }
}
