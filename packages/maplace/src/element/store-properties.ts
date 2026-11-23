import { definedFields } from "../defined-fields";
import { MaplaceError, type MaplaceOptions } from "../index";
import { child } from "../validate/fail";
import { type Check, checkFunction, checkRenderable } from "../validate/values";
import { elementMisuse, MAP_ELEMENT } from "./element-error";
import type { StandingMisuse } from "./standing-misuse";

/** Each store property, checked as the store checks its option, named on the element. */
const CHECKS = {
  sanitize: checkFunction,
  markerIcon: checkRenderable,
} satisfies Partial<Record<keyof MaplaceOptions, Check>>;

/** A property a page gives `<maplace-map>` for its store to take when it is made. */
export type StoreProperty = keyof typeof CHECKS;

type GivenProperties = { -readonly [K in StoreProperty]?: MaplaceOptions[K] };

/**
 * `sanitize` and `markerIcon`, as the page gave them: kept until the store takes them, after which
 * a change is misuse, standing until the value taken is given back.
 */
export class StoreProperties {
  readonly #given: GivenProperties = {};
  readonly #misuse: StandingMisuse;
  #taken = false;

  constructor(misuse: StandingMisuse) {
    this.#misuse = misuse;
  }

  get<K extends StoreProperty>(name: K): MaplaceOptions[K] {
    return this.#given[name];
  }

  give<K extends StoreProperty>(name: K, value: MaplaceOptions[K]): void {
    if (!this.#taken) this.#given[name] = value;
    else if (value === this.#given[name]) this.#misuse.clear(name);
    else {
      const problem = `${name} can't change once the map is created`;
      this.#misuse.fail(name, elementMisuse(problem, { field: name }));
    }
  }

  /**
   * The properties for the store, each checked: one refused is left out (and forgotten) and
   * returned with its misuse, for the caller to say once the store is in place.
   */
  take(): { options: GivenProperties; refused: [StoreProperty, MaplaceError][] } {
    this.#taken = true;
    const refused: [StoreProperty, MaplaceError][] = [];
    for (const name of Object.keys(CHECKS) as StoreProperty[]) {
      const value = this.#given[name];
      if (value === undefined) continue;
      try {
        CHECKS[name](value, child(MAP_ELEMENT, name));
      } catch (error) {
        if (!(error instanceof MaplaceError)) throw error;
        refused.push([name, error]);
        delete this.#given[name];
      }
    }
    return { options: definedFields(this.#given), refused };
  }
}
