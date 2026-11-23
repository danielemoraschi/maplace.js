import type { Location } from "../index";
import type { MaplaceLocationElement } from "./index";
import { LOCATION_ATTRIBUTES, locationFromAttributes } from "./location-attributes";
import { templatesOf } from "./location-templates";
import { locationSourceChanged } from "./source-changes";
import { MAPLACE_VERSION } from "./version";

/** What a read location is watched for beside its observed attributes. */
const UNOBSERVED_CHANGES: MutationObserverInit = {
  childList: true,
  attributes: true,
  attributeOldValue: true,
};

/**
 * `<maplace-location>`: one location, from its attributes and optional `<template>` children (the
 * popup's, and the icon's marked `data-icon`), which are author markup and trusted. Its
 * `location` stays the same object until something it is read from changes, so the store sees an
 * unchanged location as unchanged.
 */
export class MaplaceLocation extends HTMLElement implements MaplaceLocationElement {
  static readonly maplaceVersion = MAPLACE_VERSION;
  static readonly observedAttributes = LOCATION_ATTRIBUTES;

  /**
   * One observer for every location, however many, for what `observedAttributes` can't name: a
   * template added or removed, and a `data-*` attribute changed. A location is watched from when
   * it is first read, connected or not: only a read one can go stale.
   */
  static readonly #unobservedChanges = new MutationObserver((records) => {
    for (const record of records) {
      const { target } = record;
      if (target instanceof MaplaceLocation && changesLocation(record, target)) target.#changed();
    }
  });

  #read: Location | undefined;

  get location(): Location {
    if (this.#read === undefined) {
      MaplaceLocation.#unobservedChanges.observe(this, UNOBSERVED_CHANGES);
      this.#read = locationFromAttributes(this, templatesOf(this));
    }
    return this.#read;
  }

  attributeChangedCallback(_name: string, previous: string | null, value: string | null): void {
    if (previous !== value) this.#changed();
  }

  #changed(): void {
    this.#read = undefined;
    locationSourceChanged(this.parentElement);
  }
}

/** Whether `record` changes what `element` reads: a template, or a `data-*` attribute's value. */
function changesLocation(record: MutationRecord, element: Element): boolean {
  const { type, attributeName, oldValue } = record;
  if (type === "childList") {
    return holdsTemplate(record.addedNodes) || holdsTemplate(record.removedNodes);
  }
  return (
    attributeName?.startsWith("data-") === true && element.getAttribute(attributeName) !== oldValue
  );
}

function holdsTemplate(nodes: NodeList): boolean {
  for (const node of nodes) {
    if (node instanceof HTMLTemplateElement) return true;
  }
  return false;
}
