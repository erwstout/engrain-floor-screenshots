import { pendingRequests } from "./trackRequests";

const POLL_MS = 200;
export const SETTLE_QUIET_MS = 1500;
export const SETTLE_TIMEOUT_MS = 90_000;

export class SettleTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Map images were still loading after ${Math.round(timeoutMs / 1000)}s`);
    this.name = "SettleTimeoutError";
  }
}

interface SettleOptions {
  quietMs?: number;
  timeoutMs?: number;
}

const preload = (url: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = url;
  });

const cssUrls = (value: string) => Array.from(value.matchAll(/url\(["']?([^"')]+)["']?\)/g), (m) => m[1]);

// Images the browser doesn't expose a "complete" flag for: SVG <image> and CSS backgrounds.
const collectAssetUrls = (root: HTMLElement) => {
  const urls: string[] = [];
  root.querySelectorAll("image").forEach((el) => {
    const href = el.getAttribute("href") ?? el.getAttribute("xlink:href");
    if (href) urls.push(href);
  });
  root.querySelectorAll("*").forEach((el) => {
    if (!(el instanceof SVGElement)) urls.push(...cssUrls(getComputedStyle(el).backgroundImage));
  });
  return urls.filter((url) => !url.startsWith("data:"));
};

const imagesLoading = (root: HTMLElement) => Array.from(root.querySelectorAll("img")).some((img) => !img.complete);

// Finite animations only; an infinite one would never settle.
const animating = (root: HTMLElement) =>
  typeof root.getAnimations === "function" &&
  root
    .getAnimations({ subtree: true })
    .some((a) => a.playState === "running" && a.effect?.getTiming().iterations !== Infinity);

const decodeImages = (root: HTMLElement) =>
  Promise.all(Array.from(root.querySelectorAll("img"), (img) => img.decode().catch(() => undefined)));

/**
 * Resolves once nothing in `root` has loaded, changed, or animated for `quietMs`.
 * Rejects if that never happens within `timeoutMs`.
 */
export const waitForSettled = async (
  root: HTMLElement,
  { quietMs = SETTLE_QUIET_MS, timeoutMs = SETTLE_TIMEOUT_MS }: SettleOptions = {},
) => {
  const started = Date.now();
  let lastActivity = started;
  const bump = () => {
    lastActivity = Date.now();
  };

  const preloads = new Map<string, boolean>();
  const mutations = new MutationObserver(bump);
  mutations.observe(root, { subtree: true, childList: true, attributes: true });
  const resources = typeof PerformanceObserver === "function" ? new PerformanceObserver(bump) : undefined;
  resources?.observe({ type: "resource" });

  try {
    await new Promise<void>((resolve, reject) => {
      const tick = () => {
        for (const url of collectAssetUrls(root)) {
          if (preloads.has(url)) continue;
          preloads.set(url, false);
          preload(url).then(() => {
            preloads.set(url, true);
            bump();
          });
        }

        const busy =
          imagesLoading(root) || [...preloads.values()].includes(false) || animating(root) || pendingRequests() > 0;
        if (busy) bump();

        const now = Date.now();
        if (now - lastActivity >= quietMs) return resolve();
        if (now - started >= timeoutMs) {
          return reject(new SettleTimeoutError(timeoutMs));
        }
        setTimeout(tick, POLL_MS);
      };
      tick();
    });
  } finally {
    mutations.disconnect();
    resources?.disconnect();
  }

  await decodeImages(root);
};
