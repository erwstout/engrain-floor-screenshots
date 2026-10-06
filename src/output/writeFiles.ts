import { floorFileName } from "./fileNames";

export const supportsDirectoryPicker = () => typeof window.showDirectoryPicker === "function";

// `id` makes Chrome reopen the picker in the last folder used.
export const pickOutputDir = () => window.showDirectoryPicker({ id: "floor-capture", mode: "readwrite" });

export const writePng = async (
  root: FileSystemDirectoryHandle,
  assetId: string,
  floorLabel: string,
  blob: Blob,
) => {
  const dir = await root.getDirectoryHandle(assetId, { create: true });
  const file = await dir.getFileHandle(floorFileName(assetId, floorLabel), { create: true });
  const writable = await file.createWritable();
  await writable.write(blob);
  await writable.close();
};
