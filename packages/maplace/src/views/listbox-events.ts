import { CHOOSE_KEYS, nextFocus } from "./focus";
import type { ListboxEventContext } from "./listbox-context";
import { onFocusIn, onFocusOut, onPointerOut, onPointerOver } from "./listbox-hover";

const INTERACTIVE = "a, button, input, select, textarea, [tabindex]";

/**
 * Delegated handlers on the listbox: one listener per event type however many options. Uses
 * pointerover/out and focusin/out because their enter/leave counterparts don't bubble.
 */
export function listenToListbox(listbox: HTMLElement, context: ListboxEventContext): () => void {
  const handlers: Record<string, (event: Event) => void> = {
    click: (event) => onClick(context, event as MouseEvent),
    keydown: (event) => onKeyDown(context, event as KeyboardEvent),
    pointerover: (event) => onPointerOver(context, event as PointerEvent),
    pointerout: (event) => onPointerOut(context, event as PointerEvent),
    focusin: (event) => onFocusIn(context, event as FocusEvent),
    focusout: (event) => onFocusOut(context, event as FocusEvent),
  };
  for (const [type, handler] of Object.entries(handlers)) listbox.addEventListener(type, handler);
  return () => {
    for (const [type, handler] of Object.entries(handlers))
      listbox.removeEventListener(type, handler);
  };
}

function onClick(context: ListboxEventContext, event: MouseEvent): void {
  const option = context.optionAt(event.target);
  if (!option || insideInteractiveContent(option, event.target)) return;
  choose(context, option);
}

/** Selection doesn't follow focus: arrowing through the list never pans the map. */
function onKeyDown(context: ListboxEventContext, event: KeyboardEvent): void {
  const option = context.optionAt(event.target);
  if (!option || option !== event.target || withShortcutModifier(event)) return;
  if (!handleKey(context, { option, event })) return;
  // Handled keys stay in the list: no page scroll, no map pan when the list is a map control.
  event.preventDefault();
  event.stopPropagation();
}

function choose(context: ListboxEventContext, option: HTMLElement): void {
  const id = context.idOf(option);
  if (id === undefined) context.actions.showAll();
  else context.actions.choose(id);
}

/** A key pressed on an option. */
interface KeyPress {
  readonly option: HTMLElement;
  readonly event: KeyboardEvent;
}

/** Chooses or moves focus; false for a key the list leaves alone. */
function handleKey(context: ListboxEventContext, press: KeyPress): boolean {
  if (!CHOOSE_KEYS.has(press.event.key)) return moveFocus(context, press);
  // A held Enter repeats: one choice, not a pan per repeat.
  if (!press.event.repeat) choose(context, press.option);
  return true;
}

function moveFocus(context: ListboxEventContext, { option, event }: KeyPress): boolean {
  const order = context.order();
  const index = nextFocus(order.indexOf(option), event.key, order.length);
  const target = index === undefined ? undefined : order[index];
  if (!target) return false;
  context.roving.stopAt(target);
  target.focus();
  return true;
}

/** Alt, Ctrl and Meta combinations are the browser's and assistive tech's shortcuts. */
function withShortcutModifier(event: KeyboardEvent): boolean {
  return event.altKey || event.ctrlKey || event.metaKey;
}

/** A link or button inside rendered content does its own thing, not a selection. */
function insideInteractiveContent(option: HTMLElement, target: EventTarget | null): boolean {
  const interactive = target instanceof Element ? target.closest(INTERACTIVE) : null;
  return interactive !== null && interactive !== option && option.contains(interactive);
}
