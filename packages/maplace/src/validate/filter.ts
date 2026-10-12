import { arrayOf, checkString, optional } from "./values";

/** `setFilter`'s groups: a list of group names, or undefined to show every group. */
export const checkGroups = optional(arrayOf("an array of groups", checkString));
