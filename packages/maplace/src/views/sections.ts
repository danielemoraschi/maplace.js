import type { Location } from "../location";
import { reconcile } from "./keyed";
import type { Distances, EntryDistance, ListSection, ListStructure } from "./model";

/** How one kind of list makes its elements. */
export interface SectionMakers<Data, E extends Element> {
  option(): E;
  /** Fills an option for a location it shows for the first time, a new object or new metres. */
  fill(option: E, location: Location<Data>, distance: EntryDistance | undefined): void;
  /** A group and what stays before its options (the listbox's heading). */
  group(): MadeGroup;
}

/** A made group: its element, what stays before its options, and what names it. */
export type MadeGroup = {
  readonly element: Element;
  readonly head: readonly Element[];
  name(text: string): void;
};

/** What one render builds before it replaces the kept options and groups. */
interface Pass<E extends Element> {
  readonly top: Element[];
  readonly ordered: E[];
  readonly options: Map<string, E>;
  readonly groups: Map<string, MadeGroup>;
}

/** What an option was last filled with. */
interface ShownEntry<Data> {
  readonly location: Location<Data>;
  readonly distance: EntryDistance | undefined;
}

/** The options and groups of one list, kept by id and heading across renders. */
export interface Sections<Data, E extends Element> {
  /** Renders `structure` after the `fixed` elements; returns the options in display order. */
  render(structure: ListStructure<Data>, fixed: readonly Element[]): readonly E[];
  optionOf(id: string): E | undefined;
  locationOf(option: Element): Location<Data> | undefined;
  /** How far the entry `option` shows is, when the list says. */
  distanceOf(option: Element): EntryDistance | undefined;
}

/**
 * Keeps each option for as long as its id is listed, so focus and listeners survive, and fills
 * it again only for a new location object or new metres. Shared by the listbox and the
 * native select.
 */
export function createSections<Data, E extends Element>(
  container: Element,
  makers: SectionMakers<Data, E>,
): Sections<Data, E> {
  let options = new Map<string, E>();
  let groups = new Map<string, MadeGroup>();
  const shown = new WeakMap<Element, ShownEntry<Data>>();
  // The name each group was last given: compared here, never read back from the DOM, so a group
  // whose name doesn't change is left alone, with a browser's translation of it.
  const named = new WeakMap<MadeGroup, string>();

  function optionFor(location: Location<Data>, distance: EntryDistance | undefined): E {
    const option = options.get(location.id) ?? makers.option();
    const last = shown.get(option);
    if (last?.location !== location || last.distance?.metres !== distance?.metres) {
      shown.set(option, { location, distance });
      makers.fill(option, location, distance);
    }
    return option;
  }

  /**
   * A group made for this render, placed in the list at once: its members then move in within
   * the page, keeping focus and state where the browser can (`moveBefore`); the order comes after.
   */
  function newGroup(): MadeGroup {
    const group = makers.group();
    container.append(group.element);
    return group;
  }

  function nameGroup(group: MadeGroup, name: string): void {
    if (named.get(group) === name) return;
    named.set(group, name);
    group.name(name);
  }

  /** One section's options, at the top or in their group, recorded in this render's pass. */
  function renderSection(
    pass: Pass<E>,
    { heading, label, locations }: ListSection<Data>,
    distances: Distances | undefined,
  ): void {
    const group = heading === undefined ? undefined : (groups.get(heading) ?? newGroup());
    const members: Element[] = group ? [...group.head] : pass.top;
    for (const location of locations) {
      const option = optionFor(location, distances?.of.get(location.id));
      pass.options.set(location.id, option);
      members.push(option);
      pass.ordered.push(option);
    }
    if (group === undefined || heading === undefined) return;
    nameGroup(group, label ?? heading);
    reconcile(group.element, members);
    pass.groups.set(heading, group);
    pass.top.push(group.element);
  }

  return {
    render(structure, fixed) {
      const pass: Pass<E> = { top: [...fixed], ordered: [], options: new Map(), groups: new Map() };
      for (const section of structure.sections) {
        renderSection(pass, section, structure.distances);
      }
      reconcile(container, pass.top);
      options = pass.options;
      groups = pass.groups;
      return pass.ordered;
    },
    optionOf: (id) => options.get(id),
    locationOf: (option) => shown.get(option)?.location,
    distanceOf: (option) => shown.get(option)?.distance,
  };
}
