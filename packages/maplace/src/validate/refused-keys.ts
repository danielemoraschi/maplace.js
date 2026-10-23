import { child, reject } from "./fail";
import type { Assert } from "./record";
import { checkObject } from "./values";

/**
 * Checks an object (a non-object is told it must be `expected`) holding none of `remarks`' keys,
 * each refused with its remark: settings its caller takes elsewhere, said in the caller's words.
 */
export function refusedKeysCheck<T extends object>(
  remarks: Readonly<Record<string, string>>,
  expected: string,
): Assert<T> {
  const refused = Object.entries(remarks);
  return (value, field) => {
    checkObject(value, field, expected);
    for (const [key, remark] of refused) {
      if (key in value) reject(child(field, key), remark);
    }
  };
}
