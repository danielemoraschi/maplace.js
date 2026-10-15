import type { Location } from "../index";
import type { MaplaceLocationElement } from "./index";
import { LOCATION_ATTRIBUTES, locationFromAttributes } from "./location-attributes";
import { locationSourceChanged } from "./source-changes";
import { MAPLACE_VERSION } from "./version";

/**
 * `<maplace-location>`: one location, from its attributes and an optional `<template>` child,
 * which is author markup and trusted. Its `location` stays the same object until something it is
 * read from changes, so the store sees an unchanged location as unchanged.
 */
export class MaplaceLocation extends HTMLElement implements MaplaceLocationElement {
  static readonly maplaceVersion = MAPLACE_VERSION;
  static readonly observedAttributes = LOCATION_ATTRIBUTES;

  /** One observer for every location, however many: a template added or removed. */
  static readonly #templates = new MutationObserver((records) => {
    for (const { target, addedNodes, removedNodes } of records) {
      if (!(target instanceof MaplaceLocation)) continue;
      if (holdsTemplate(addedNodes) || holdsTemplate(removedNodes)) target.#changed();
    }
  });

  #read: Location | undefined;

  get location(): Location {
    this.#read ??= locationFromAttributes(this, this.#popupContent());
    return this.#read;
  }

  connectedCallback(): void {
    MaplaceLocation.#templates.observe(this, { childList: true });
  }

  attributeChangedCallback(_name: string, previous: string | null, value: string | null): void {
    if (previous !== value) this.#changed();
  }

  #changed(): void {
    this.#read = undefined;
    locationSourceChanged(this.parentElement);
  }

  /** The template's content, cloned for each popup; none without a template. */
  #popupContent(): (() => Node) | undefined {
    const template = this.querySelector<HTMLTemplateElement>(":scope > template");
    return template === null ? undefined : () => template.content.cloneNode(true);
  }
}

function holdsTemplate(nodes: NodeList): boolean {
  for (const node of nodes) {
    if (node instanceof HTMLTemplateElement) return true;
  }
  return false;
}
