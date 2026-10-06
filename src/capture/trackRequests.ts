// Counts fetch/XHR work in flight. PerformanceObserver only reports requests after they finish,
// so a slow image download looks "quiet" without this.
let pending = 0;
let installed = false;

export const pendingRequests = () => pending;

const track = <T>(work: Promise<T>) => {
  pending++;
  return work.finally(() => pending--);
};

export const trackRequests = () => {
  if (installed || typeof window.fetch !== "function") return;
  installed = true;

  const fetch = window.fetch.bind(window);
  window.fetch = (...args) => track(fetch(...args));

  // fetch resolves on headers; the body download happens in these.
  for (const method of ["arrayBuffer", "blob", "json", "text"] as const) {
    const original = Response.prototype[method] as (this: Response) => Promise<unknown>;
    Object.defineProperty(Response.prototype, method, {
      configurable: true,
      value(this: Response) {
        return track(original.call(this));
      },
    });
  }

  // Covers `new Image()` loads that never touch the DOM.
  const src = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
  if (src?.set) {
    Object.defineProperty(HTMLImageElement.prototype, "src", {
      ...src,
      set(this: HTMLImageElement, value: string) {
        if (!String(value).startsWith("data:")) {
          pending++;
          const done = () => {
            pending--;
            this.removeEventListener("load", done);
            this.removeEventListener("error", done);
          };
          this.addEventListener("load", done);
          this.addEventListener("error", done);
        }
        src.set!.call(this, value);
      },
    });
  }

  const send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) {
    pending++;
    this.addEventListener("loadend", () => pending--, { once: true });
    return send.apply(this, args);
  };
};
