import { HEATMAP_ZOOMS, type HeatmapOptions, type MaplaceOptions } from "../options";
import { child, mustBe, reject, root } from "./fail";
import { checkGroup } from "./group";
import { validateLocations } from "./locations";
import { OLD_OPTIONS } from "./migration";
import { checkPopupOptions } from "./popup";
import { type Assert, recordOf } from "./record";
import { checkShapeStyle, shapeStyleChecks } from "./style";
import {
  arrayOf,
  type Check,
  checkBoolean,
  checkFunction,
  checkNonBlankString,
  checkNonEmptyString,
  numberIn,
  optional,
} from "./values";
import { checkView } from "./viewport";

const GROUPS = "an array of one or more groups";

/** The heatmap's groups: one at least, as none would heat nothing (leave it out for every marker). */
const checkGroups: Check = (value, field) => {
  arrayOf(GROUPS, checkHeatGroup)(value, field);
  if ((value as readonly unknown[]).length === 0) mustBe(field, GROUPS, value);
};

/** A heatmap's group: a path, or a name that isn't empty. */
const checkHeatGroup: Check = (value, field) =>
  typeof value === "string" ? checkNonEmptyString(value, field) : checkGroup(value, field);

const checkHeatmap: Assert<HeatmapOptions> = recordOf<HeatmapOptions>({
  checks: {
    groups: optional(checkGroups),
    maxZoom: optional(numberIn(HEATMAP_ZOOMS)),
  },
  unknown: "is not a heatmap option",
});

const checkOptionFields: Assert<MaplaceOptions> = recordOf<MaplaceOptions, "locations">({
  checks: {
    selectedId: optional(checkNonEmptyString),
    sanitize: optional(checkFunction),
    popup: optional(checkPopupOptions),
    ...shapeStyleChecks(checkShapeStyle),
    cluster: optional(checkBoolean),
    heatmap: optional(checkHeatmap),
    view: optional(checkView),
    skipMapLabel: optional(checkNonBlankString),
    selectedLabel: optional(checkNonBlankString),
  },
  unchecked: ["locations"],
  unknown: "is not a maplace option",
  remarks: OLD_OPTIONS,
});

/** `createMaplace` options; whether `selectedId` names a location is the store's check. */
export function validateOptions(value: unknown): asserts value is MaplaceOptions | undefined {
  if (value === undefined) return;
  const field = child(root("createMaplace"), "options");
  checkOptionFields(value, field);
  if (value.cluster === true && value.heatmap !== undefined) {
    reject(child(field, "heatmap"), "can't be used with cluster");
  }
  if (value.locations !== undefined) {
    validateLocations(value.locations, {
      caller: "createMaplace",
      sanitize: value.sanitize,
      heatmap: value.heatmap,
    });
  }
}
