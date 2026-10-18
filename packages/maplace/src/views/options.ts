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

const checkFields: Assert<ListViewOptions> = recordOf<ListViewOptions>({
  checks: {
    as: optional(oneOf(AS)),
    groupHeadings: optional(checkBoolean),
    fitAllLabel: optional(checkNonBlankString),
    label: optional(checkNonBlankString),
    heading: optional(checkNonBlankString),
    render: optional(checkFunction),
  },
  unknown: "is not a list view option",
});

/** `createListView` options; `render` with `as: 'select'` is refused, never ignored. */
export function checkListViewOptions(
  value: unknown,
  field: Field,
): asserts value is ListViewOptions | undefined {
  if (value === undefined) return;
  checkFields(value, field);
  if (value.as === "select" && value.render !== undefined) {
    reject(field, "render needs as: 'list'; a native select option holds text only");
  }
}
