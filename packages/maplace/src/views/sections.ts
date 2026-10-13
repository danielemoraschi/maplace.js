import type { Location } from "../location";
import { reconcile } from "./keyed";
import type { ListSection, ListStructure } from "./model";

/** How one kind of list makes its elements. */
export interface SectionMakers<Data, E extends Element> {
  option(): E;
  /** Fills an option for a location it shows for the first time, or a new object for it. */
  fill(option: E, location: Location<Data>): void;
  /** A group and what stays before its options (the listbox's heading). */
  group(heading: string): MadeGroup;
}

/** A made group: its element, and what stays before its options. */
export type MadeGroup = { readonly element: Element; readonly head: readonly Element[] };

/** What one render builds before it replaces the kept options and groups. */
interface Pass<E extends Element> {
  readonly top: Element[];
  readonly ordered: E[];
  readonly options: Map<string, E>;
  readonly groups: Map<string, MadeGroup>;
}

/** The options and groups of one list, kept by id and heading across renders. */
export interface Sections<Data, E extends Element> {
  /** Renders `structure` after the `fixed` elements; returns the options in display order. */
  render(structure: ListStructure<Data>, fixed: readonly Element[]): readonly E[];
  optionOf(id: string): E | undefined;
  locationOf(option: Element): Location<Data> | undefined;
}

/**
 * Keeps each option for as long as its id is listed, so focus and listeners survive, and fills
 * it again only for a new location object. Shared by the listbox and the native select.
 */
export function createSections<Data, E extends Element>(
  container: Element,
  makers: SectionMakers<Data, E>,
): Sections<Data, E> {
  let options = new Map<string, E>();
  let groups = new Map<string, MadeGroup>();
  const shown = new WeakMap<Element, Location<Data>>();

  function optionFor(location: Location<Data>): E {
    const option = options.get(location.id) ?? makers.option();
    if (shown.get(option) !== location) {
      shown.set(option, location);
      makers.fill(option, location);
    }
    return option;
  }

  /**
   * A group made for this render, placed in the list at once: its members then move in within
   * the page, keeping focus and state where the browser can (`moveBefore`); the order comes after.
   */
  function newGroup(heading: string): MadeGroup {
    const group = makers.group(heading);
    container.append(group.element);
    return group;
  }

  /** One section's options, at the top or in their group, recorded in this render's pass. */
  function renderSection(pass: Pass<E>, { heading, locations }: ListSection<Data>): void {
    const group = heading === undefined ? undefined : (groups.get(heading) ?? newGroup(heading));
    const members: Element[] = group ? [...group.head] : pass.top;
    for (const location of locations) {
      const option = optionFor(location);
      pass.options.set(location.id, option);
      members.push(option);
      pass.ordered.push(option);
    }
    if (group === undefined || heading === undefined) return;
    reconcile(group.element, members);
    pass.groups.set(heading, group);
    pass.top.push(group.element);
  }

  return {
    render(structure, fixed) {
      const pass: Pass<E> = { top: [...fixed], ordered: [], options: new Map(), groups: new Map() };
      for (const section of structure.sections) renderSection(pass, section);
      reconcile(container, pass.top);
      options = pass.options;
      groups = pass.groups;
      return pass.ordered;
    },
    optionOf: (id) => options.get(id),
    locationOf: (option) => shown.get(option),
  };
}
