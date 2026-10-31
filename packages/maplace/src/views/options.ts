import type { ListViewOptions } from "../list-view";
import { type Field, reject } from "../validate/fail";
import { type Assert, recordOf } from "../validate/record";
import {
  checkBoolean,
  checkFunction,
  checkNonBlankString,
  members,
  oneOf,
  optional,
} from "../validate/values";

const AS = members<NonNullable<ListViewOptions["as"]>>({ list: true, select: true });
const SCOPES = members<NonNullable<ListViewOptions["scope"]>>({ viewport: true });

const checkFields: Assert<ListViewOptions> = recordOf<ListViewOptions>({
  checks: {
    as: optional(oneOf(AS)),
    groupHeadings: optional(checkBoolean),
    groupCounts: optional(checkBoolean),
    fitAllLabel: optional(checkNonBlankString),
    label: optional(checkNonBlankString),
    heading: optional(checkNonBlankString),
    render: optional(checkFunction),
    scope: optional(oneOf(SCOPES)),
    areaOnlyLabel: optional(checkNonBlankString),
    showAllLabel: optional(checkNonBlankString),
    emptyAreaLabel: optional(checkNonBlankString),
    searchLabel: optional(checkNonBlankString),
    noMatchesLabel: optional(checkNonBlankString),
    matchesLabel: optional(checkNonBlankString),
  },
  unknown: "is not a list view option",
});

/**
 * `createListView` options; `render`, `scope` or `searchLabel` with `as: 'select'`, and
 * `groupCounts` with `groupHeadings: false`, are refused, never ignored.
 */
export function checkListViewOptions(
  value: unknown,
  field: Field,
): asserts value is ListViewOptions | undefined {
  if (value === undefined) return;
  checkFields(value, field);
  if (value.groupCounts && value.groupHeadings === false) {
    reject(field, "groupCounts needs group headings, and groupHeadings is false");
  }
  if (value.as === "select") refuseForSelect(value, field);
}

function refuseForSelect(value: ListViewOptions, field: Field): void {
  if (value.render !== undefined) {
    reject(field, "render needs as: 'list'; a native select option holds text only");
  }
  if (value.scope !== undefined) {
    reject(field, "scope needs as: 'list'; a native select has no room for its button");
  }
  if (value.searchLabel !== undefined) {
    reject(field, "searchLabel needs as: 'list'; a native select has no room for its box");
  }
}
