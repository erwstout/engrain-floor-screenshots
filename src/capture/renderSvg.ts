// SVG properties the SDK may set through stylesheets; a standalone SVG image can't see those rules.
const STYLE_PROPS = [
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "paint-order",
  "opacity",
  "visibility",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "letter-spacing",
  "text-anchor",
  "dominant-baseline",
  "clip-path",
  "mask",
  "filter",
];

// Computed url() values point at the page, e.g. url("http://host/#clip"). Keep only the fragment.
const localUrl = (value: string) => value.replace(/url\(["']?[^"')]*?(#[^"')]+)["']?\)/g, "url($1)");

const isRasterImage = (el: Element) => el.tagName.toLowerCase() === "image" && !el.getAttribute("href")?.startsWith("data:");

/**
 * Serializes the live map SVG at `width` x `height` output pixels, without hidden floors
 * or raster images (those are drawn separately at full resolution).
 */
export const serializeSvg = (svg: SVGSVGElement, width: number, height: number) => {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const source = svg.querySelectorAll("*");
  const copies = clone.querySelectorAll("*");
  const drop: Element[] = [];

  source.forEach((el, i) => {
    const copy = copies[i] as SVGElement;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || isRasterImage(el)) return drop.push(copy);
    for (const prop of STYLE_PROPS) {
      const value = cs.getPropertyValue(prop);
      if (value) copy.style.setProperty(prop, localUrl(value));
    }
  });
  drop.forEach((el) => el.remove());

  if (!clone.getAttribute("viewBox")) {
    clone.setAttribute("viewBox", `0 0 ${svg.getAttribute("width") ?? width} ${svg.getAttribute("height") ?? height}`);
  }
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  return new XMLSerializer().serializeToString(clone);
};

export const loadSvgImage = async (markup: string) => {
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
};
