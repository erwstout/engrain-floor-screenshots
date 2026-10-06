import { drawRasterImages, isVisible, rasterImages } from "./compositeImages";
import { loadSvgImage, serializeSvg } from "./renderSvg";

export const STAGE_SIZE_PX = 2000;
export const MAX_CANVAS_PX = 16384;
export const SCALE_OPTIONS = [2, 4, 6, 8] as const;

export const clampScale = (scale: number) => Math.max(1, Math.min(scale, Math.floor(MAX_CANVAS_PX / STAGE_SIZE_PX)));

const toPng = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Capture returned an empty image"))), "image/png"),
  );

// White base, full-resolution background image, then the map's vector layer rendered at output size.
export const captureFloor = async (stage: HTMLElement, scale: number): Promise<Blob> => {
  const ratio = clampScale(scale);
  const svg = stage.querySelector("svg");
  if (!svg) throw new Error("Map SVG not found in the stage");

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = STAGE_SIZE_PX * ratio;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await drawRasterImages(ctx, stage, rasterImages(stage).filter(isVisible), ratio);

  const box = svg.getBoundingClientRect();
  const origin = stage.getBoundingClientRect();
  const width = Math.round((box.width || STAGE_SIZE_PX) * ratio);
  const height = Math.round((box.height || STAGE_SIZE_PX) * ratio);
  const vectors = await loadSvgImage(serializeSvg(svg, width, height));
  ctx.drawImage(vectors, (box.left - origin.left) * ratio, (box.top - origin.top) * ratio, width, height);

  return toPng(canvas);
};
