/** What a `<maplace-location>`'s `<template>` children give its location. */
export interface LocationTemplates {
  /** The unmarked template's content, cloned for each popup. */
  readonly content: (() => Node) | undefined;
  /** The `data-icon` template's content as one element, cloned for each state. */
  readonly icon: (() => Element) | undefined;
}

/**
 * The popup and icon templates among `element`'s children: author markup, trusted. Each call of a
 * builder makes a fresh copy, so a popup or a marker never takes the template's own nodes.
 */
export function templatesOf(element: Element): LocationTemplates {
  const popup = element.querySelector<HTMLTemplateElement>(":scope > template:not([data-icon])");
  const icon = element.querySelector<HTMLTemplateElement>(":scope > template[data-icon]");
  return {
    content: popup ? () => popup.content.cloneNode(true) : undefined,
    icon: icon ? () => iconFrom(icon) : undefined,
  };
}

/** A marker is one element: the template's, when it holds just one, else a span around it all. */
function iconFrom(template: HTMLTemplateElement): Element {
  const sole = soleElementOf(template.content);
  if (sole) return sole.cloneNode(true) as Element;
  const span = template.ownerDocument.createElement("span");
  span.append(template.content.cloneNode(true));
  return span;
}

/** The fragment's one element, when nothing but whitespace is beside it. */
function soleElementOf(content: DocumentFragment): Element | undefined {
  const beside = [...content.childNodes].filter((node) => node !== content.firstElementChild);
  const alone = beside.every(
    (node) => node.nodeType === node.TEXT_NODE && !node.textContent?.trim(),
  );
  return content.childElementCount === 1 && alone
    ? (content.firstElementChild ?? undefined)
    : undefined;
}
