import type { FilterRequest, LocationFilter } from "../location-state";
import type { Field } from "./fail";
import { recordOf } from "./record";
import { arrayOf, type Check, checkString, checkTags, optional } from "./values";

const checkGroups = arrayOf("an array of groups", checkString);

const checkFilterFields: Check = recordOf<LocationFilter>({
  checks: {
    groups: optional(checkGroups),
    tags: optional(checkTags),
  },
  unknown: "is not a filter field",
  expected: "a list of groups, or an object of groups and tags",
});

const checkRequest = optional((value, field) =>
  (Array.isArray(value) ? checkGroups : checkFilterFields)(value, field),
);

/** `request`, checked at `field`, as a filter; one asking for nothing (no groups, no tags) is none. */
export function filterFrom(request: FilterRequest, field: Field): LocationFilter | undefined {
  checkRequest(request, field);
  const { groups, tags } = isGroupList(request)
    ? { groups: request, tags: undefined }
    : (request ?? {});
  const askedTags = tags?.length ? tags : undefined;
  return groups === undefined && askedTags === undefined ? undefined : { groups, tags: askedTags };
}

function isGroupList(request: FilterRequest): request is readonly string[] {
  return Array.isArray(request);
}
