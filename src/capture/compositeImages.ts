// Draws the map's SVG <image> rasters straight onto a canvas from their source files.

export const isVisible = (el: Element) =>
  typeof el.checkVisibility !== "function" || el.checkVisibility({ opacityProperty: true, visibilityProperty: true });

export const rasterImages = (root: HTMLElement): SVGImageElement[] =>
  Array.from(root.querySelectorAll("image")).filter((el) => el.href.baseVal && !el.href.baseVal.startsWith("data:"));

// The SDK's own load is cached without CORS headers, so a cached fetch fails. Skip the HTTP cache
// and keep the last file in memory so floors that share it download once.
let lastBlob: { url: string; blob: Promise<Blob> } | undefined;

const fetchBlob = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load map image (${res.status})`);
  return res.blob();
};

const loadBlob = (url: string) => {
  if (lastBlob?.url !== url) {
    lastBlob = { url, blob: fetchBlob(url) };
    lastBlob.blob.catch(() => (lastBlob = undefined));
  }
  return lastBlob.blob;
};

// Reads the pixel size without decoding the whole image.
const naturalSize = async (blob: Blob) => {
  const src = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = src;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Map image could not be decoded"));
    });
    return { width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(src);
  }
};

// Every floor shares one background, so keep the last resized copy instead of decoding 25MB per floor.
let lastBitmap: { key: string; bitmap: Promise<ImageBitmap> } | undefined;

const resizedBitmap = (url: string, blob: Blob, width: number, height: number) => {
  const key = `${url}|${width}x${height}`;
  if (lastBitmap?.key !== key) {
    lastBitmap?.bitmap.then((b) => b.close(), () => undefined);
    lastBitmap = {
      key,
      bitmap: createImageBitmap(blob, { resizeWidth: width, resizeHeight: height, resizeQuality: "high" }),
    };
    lastBitmap.bitmap.catch(() => (lastBitmap = undefined));
  }
  return lastBitmap.bitmap;
};

type Size = { width: number; height: number };

// Applies the default preserveAspectRatio (xMidYMid meet) unless it is "none".
const fitRect = (el: SVGImageElement, size: Size) => {
  const x = el.x.baseVal.value;
  const y = el.y.baseVal.value;
  const w = el.width.baseVal.value || size.width;
  const h = el.height.baseVal.value || size.height;
  if (el.preserveAspectRatio.baseVal.align === SVGPreserveAspectRatio.SVG_PRESERVEASPECTRATIO_NONE) {
    return { x, y, w, h };
  }
  const s = Math.min(w / size.width, h / size.height);
  const fw = size.width * s;
  const fh = size.height * s;
  return { x: x + (w - fw) / 2, y: y + (h - fh) / 2, w: fw, h: fh };
};

/**
 * Resizes the source to the exact output pixels, then draws it 1:1.
 * Letting the canvas shrink a huge bitmap at draw time leaves soft, low-res patches in Chrome.
 */
export const drawRasterImages = async (
  ctx: CanvasRenderingContext2D,
  root: HTMLElement,
  images: SVGImageElement[],
  ratio: number,
) => {
  const origin = root.getBoundingClientRect();

  for (const el of images) {
    const m = el.getScreenCTM();
    if (!m) continue;
    const blob = await loadBlob(el.href.baseVal);
    const r = fitRect(el, await naturalSize(blob));

    const left = Math.round((m.a * r.x + m.c * r.y + m.e - origin.left) * ratio);
    const top = Math.round((m.b * r.x + m.d * r.y + m.f - origin.top) * ratio);
    const width = Math.round(Math.hypot(m.a, m.b) * r.w * ratio);
    const height = Math.round(Math.hypot(m.c, m.d) * r.h * ratio);
    if (width < 1 || height < 1) continue;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(await resizedBitmap(el.href.baseVal, blob, width, height), left, top);
  }
};
