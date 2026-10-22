import type { Browser, BrowserContext, ConsoleMessage, Page, Route } from "playwright";
import { integrityOf } from "./subresource-integrity.ts";

/** The page's origin, and the CDN's: another one, as jsDelivr is to a reader's page. */
const PAGE = "https://page.maplace.test/";
const CDN = "https://cdn.maplace.test/";

/** A worker the page made: its URL and type, whether it answered, and the errors it raised. */
export interface RecordedWorker {
  readonly url: string;
  readonly type: string;
  readonly answered: boolean;
  readonly errors: readonly string[];
}

/** What a page loads: the CDN script, by its file name and bytes, and the body using it. */
export interface CdnScriptPageContent {
  readonly file: string;
  readonly script: Uint8Array;
  readonly body: string;
}

/** A page loading one CDN script from another origin, pinned to its integrity, recorded. */
export interface CdnScriptPage {
  readonly page: Page;
  workers(): Promise<readonly RecordedWorker[]>;
  /** Every request but the page and the script: refused. */
  offsite(): readonly string[];
  /** What the page threw, and the errors and warnings it logged naming maplace or MapLibre. */
  logged(): readonly string[];
  close(): Promise<void>;
}

/** Makes each `Worker` the page creates leave a record in `window.recordedWorkers`. */
function recordWorkers(): void {
  const NativeWorker = window.Worker;
  const records: object[] = [];
  Object.assign(window, { recordedWorkers: records });
  window.Worker = class extends NativeWorker {
    constructor(url: string | URL, options?: WorkerOptions) {
      super(url, options);
      const record = {
        url: String(url),
        type: options?.type ?? "classic",
        answered: false,
        errors: [] as string[],
      };
      records.push(record);
      this.addEventListener("message", () => {
        record.answered = true;
      });
      this.addEventListener("error", (event) => record.errors.push(event.message));
    }
  };
}

/** Opens `content` at its own origin, the script served from the CDN's as jsDelivr serves it. */
export async function openCdnScriptPage(
  browser: Browser,
  content: CdnScriptPageContent,
): Promise<CdnScriptPage> {
  const context = await browser.newContext();
  const offsite: string[] = [];
  const logged: string[] = [];
  await context.addInitScript(recordWorkers);
  await routePageAndScript(context, content, (url) => offsite.push(url));
  const page = await context.newPage();
  page.on("pageerror", (error) => logged.push(error.message));
  page.on("console", (message) => {
    if (isMapProblem(message)) logged.push(message.text());
  });
  await page.goto(PAGE);
  return {
    page,
    workers: () =>
      page.evaluate(
        () => (window as unknown as { recordedWorkers: RecordedWorker[] }).recordedWorkers,
      ),
    offsite: () => offsite,
    logged: () => logged,
    close: () => context.close(),
  };
}

/** An error or warning naming maplace or MapLibre: not the GL driver's own notices. */
function isMapProblem(message: ConsoleMessage): boolean {
  return ["error", "warning"].includes(message.type()) && /maplace|maplibre/i.test(message.text());
}

async function routePageAndScript(
  context: BrowserContext,
  content: CdnScriptPageContent,
  refuse: (url: string) => void,
): Promise<void> {
  const html = pageHtml(content);
  await context.route("**/*", (route: Route) => {
    const url = route.request().url();
    if (url === PAGE) return route.fulfill({ contentType: "text/html", body: html });
    if (url === CDN + content.file) {
      return route.fulfill({
        contentType: "text/javascript",
        headers: { "access-control-allow-origin": "*" },
        body: Buffer.from(content.script),
      });
    }
    refuse(url);
    return route.abort();
  });
}

function pageHtml({ file, script, body }: CdnScriptPageContent): string {
  return [
    "<!doctype html>",
    `<script src="${CDN}${file}" integrity="${integrityOf(script)}" crossorigin="anonymous"></script>`,
    body,
  ].join("\n");
}
