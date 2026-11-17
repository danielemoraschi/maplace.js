import { MAX_GROUP_DEPTH } from "../group-path";
import { mustBe } from "./fail";
import { arrayOf, type Check, checkNonBlankString } from "./values";

const GROUP = `a group name, or a path of 1 to ${MAX_GROUP_DEPTH} names`;

const checkPath = arrayOf(GROUP, checkNonBlankString);

/** A group: a name (blank allowed, as it gets no heading), or a path of 1 to 3 non-blank names. */
export const checkGroup: Check = (value, field) => {
  if (typeof value === "string") return;
  checkPath(value, field);
  const { length } = value as readonly unknown[];
  if (length === 0 || length > MAX_GROUP_DEPTH) mustBe(field, GROUP, value);
};

/** The groups a filter asks for. */
export const checkGroups: Check = arrayOf("an array of groups", checkGroup);
