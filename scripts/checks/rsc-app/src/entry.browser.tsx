import { createFromReadableStream } from "@vitejs/plugin-rsc/browser";
import type { ReactNode } from "react";
import { hydrateRoot } from "react-dom/client";

// Hydrates the page from its RSC stream, as the plugin's starter does.
const response = await fetch(`${globalThis.location.href}.rsc`);
const root = await createFromReadableStream<ReactNode>(response.body as ReadableStream);
hydrateRoot(document, root);
