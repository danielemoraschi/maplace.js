import { activeElementAround } from "./active-element";
import type { HoverCommand } from "./hover-intent";
import type { ListboxEventContext } from "./listbox-context";

// Hover follows the pointer (mouse and pen) and keyboard focus; the view's intent decides what
// to ask of the store, so one move is at most one command.

const hovers = (event: PointerEvent) =>
  event.pointerType === "mouse" || event.pointerType === "pen";

export function onPointerOver(context: ListboxEventContext, event: PointerEvent): void {
  // Touch selects with a tap; a scroll gesture must not flash hover on the map.
  if (!hovers(event)) return;
  const option = context.optionAt(event.target);
  const id = option && context.idOf(option);
  apply(
    context,
    id === undefined ? context.intent.pointerLeft() : context.intent.pointerEntered(id),
  );
}

export function onPointerOut(context: ListboxEventContext, event: PointerEvent): void {
  if (!hovers(event) || context.optionAt(event.relatedTarget)) return;
  apply(context, context.intent.pointerLeft());
}

export function onFocusIn(context: ListboxEventContext, event: FocusEvent): void {
  const option = context.optionAt(event.target);
  if (!option || context.roving.isRefocusing()) return;
  context.roving.stopAt(option);
  const id = context.idOf(option);
  // A click or a tap focuses too; only keyboard focus hovers, the pointer has its own.
  const hovering = id !== undefined && isKeyboardFocus(option);
  apply(context, hovering ? context.intent.focused(id) : context.intent.blurred());
}

/** Moving between options is one focusin, not a blur and a focus: only leaving the list blurs. */
export function onFocusOut(context: ListboxEventContext, event: FocusEvent): void {
  if (leftTheList(context, event)) apply(context, context.intent.blurred());
}

/** Not the view's own refocus, not a move to another option, not the window losing focus. */
function leftTheList(context: ListboxEventContext, event: FocusEvent): boolean {
  if (context.roving.isRefocusing() || context.optionAt(event.relatedTarget)) return false;
  return !windowBlurred(event);
}

/** On a window blur the option stays the active element; a real focus move has changed it. */
function windowBlurred(event: FocusEvent): boolean {
  const target = event.target;
  return target instanceof Element && target === activeElementAround(target);
}

/** The browser's own "focus from the keyboard"; where it can't tell, assume the keyboard. */
function isKeyboardFocus(element: Element): boolean {
  try {
    return element.matches(":focus-visible");
  } catch {
    return true;
  }
}

function apply(context: ListboxEventContext, command: HoverCommand): void {
  if (command && "hover" in command) context.actions.hover(command.hover);
  else if (command) context.actions.unhover(command.unhover);
}
