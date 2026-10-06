import type { SdkFloorData } from "../unitmap/types";

const sanitize = (value: string) => value.trim().replace(/[^A-Za-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");

export const floorFileLabel = (floor: SdkFloorData, index: number): string =>
  sanitize(floor.shortLabel ?? "") || sanitize(floor.label ?? "") || String(index + 1);

export const floorFileName = (assetId: string, floorLabel: string) =>
  `${sanitize(assetId)}_floor-${floorLabel}.png`;
