/// <reference types="google.maps" />
import { StubMVCObject } from "./stub-mvc";

export class StubSize {
  constructor(
    readonly width: number,
    readonly height: number,
  ) {}
}

/**
 * Google's InfoWindow as far as the adapter uses one: while open its heading and content are in a
 * box on the page, `domready` follows each open or new content in a microtask, and every close
 * fires `close`.
 */
export class StubInfoWindow extends StubMVCObject {
  readonly box = document.createElement("div");
  /** What each `open` was given, in order. */
  readonly opens: google.maps.InfoWindowOpenOptions[] = [];
  #open = false;

  constructor(options: object = {}) {
    super();
    this.setValues(options);
  }

  get isOpen(): boolean {
    return this.#open;
  }

  setOptions(options: object): void {
    this.setValues(options);
    if ("content" in options || "headerContent" in options) this.#draw();
    if ("content" in options && this.#open) this.#ready();
  }

  setContent(content: Node): void {
    this.setOptions({ content });
  }

  getContent(): unknown {
    return this.get("content");
  }

  setPosition(position: unknown): void {
    this.set("position", position);
  }

  open(options: google.maps.InfoWindowOpenOptions): void {
    if (this.#open) this.trigger("close");
    this.opens.push(options);
    this.#open = true;
    document.body.append(this.box);
    this.#ready();
  }

  close(): void {
    if (!this.#open) return;
    this.#open = false;
    this.box.remove();
    this.trigger("close");
  }

  /** A click on the close button: Google closes the window, then says the user did. */
  closeByUser(): void {
    this.close();
    this.trigger("closeclick");
  }

  /** The heading Google draws beside its close button, then the content. */
  #draw(): void {
    const parts = [this.get("headerContent"), this.get("content")] as (Node | null | undefined)[];
    this.box.replaceChildren(...parts.filter((part): part is Node => part != null));
  }

  #ready(): void {
    queueMicrotask(() => {
      if (this.#open) this.trigger("domready");
    });
  }
}
