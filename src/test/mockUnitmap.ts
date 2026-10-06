import { vi } from "vitest";
import type { SdkFloorData, SdkFloorSelection, UnitMap, UnitMapFactory } from "../unitmap/types";

export const DEFAULT_FLOORS: SdkFloorData[] = [
  { id: "f1", label: "Floor 1", shortLabel: "1" },
  { id: "f2", label: "Floor 2", shortLabel: "2" },
];

const selection = (floors: SdkFloorData[], onShow: (id: string) => void): SdkFloorSelection => ({
  length: floors.length,
  at: (i) => selection(floors.slice(i, i + 1), onShow),
  find: (id) => selection(floors.filter((f) => [id].flat().includes(f.id)), onShow),
  first: () => selection(floors.slice(0, 1), onShow),
  show() {
    if (floors[0]) onShow(floors[0].id);
    return this;
  },
  data: () => floors,
});

export const createMockUnitmap = (floors = DEFAULT_FLOORS, { fail = false } = {}) =>
  vi.fn<UnitMapFactory>((elementId) => {
    document.getElementById(elementId)?.replaceChildren(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
    const handlers: Record<string, (...args: unknown[]) => void> = {};
    let current = floors[0];
    const map: UnitMap = {
      on: (event, cb) => {
        handlers[event] = cb;
      },
      load: vi.fn(() => {
        queueMicrotask(() => (fail ? handlers.error?.(new Error("boom")) : handlers.ready?.()));
      }),
      autoScale: vi.fn(),
      floors: () => selection(floors, (id) => (current = floors.find((f) => f.id === id) ?? current)),
      floor: () => ({ ...current, show: () => map.floor() }),
      remove: vi.fn(),
    };
    return map;
  });
