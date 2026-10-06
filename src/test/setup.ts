import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { createMockUnitmap } from "./mockUnitmap";

vi.mock("/src/capture/waitForSettled", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../capture/waitForSettled")>()),
  waitForSettled: vi.fn(async () => undefined),
}));

HTMLImageElement.prototype.decode = vi.fn(async () => undefined);
URL.createObjectURL ??= vi.fn(() => "blob:mock");
URL.revokeObjectURL ??= vi.fn();

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  setTransform: vi.fn(),
  translate: vi.fn(),
  transform: vi.fn(),
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.toBlob = function (cb) {
  cb(new Blob(["png"], { type: "image/png" }));
};

beforeEach(() => {
  window.unitmap = createMockUnitmap();
  window.showDirectoryPicker = vi.fn() as unknown as typeof window.showDirectoryPicker;
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(0), 0) as unknown as number;
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});
